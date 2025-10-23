const express = require("express");
const cors = require("cors");
const session = require('express-session');
const passport = require('./config/passport');
const vendorPassport = require('./config/vendorPassport');
const pool = require('./db/config');
// Import new organized routes
const authRoutes = require('./routes/shared/authRoutes');
const googleAuthRoutes = require('./routes/shared/googleAuthRoutes');
const vendorGoogleAuthRoutes = require('./routes/vendor/vendorGoogleAuthRoutes');
const orderRoutes = require('./routes/shared/orderRoutes');
const addressRoutes = require('./routes/shared/addressRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');
const adminLocationRoutes = require('./routes/admin/locationRoutes');
const vendorRoutes = require('./routes/vendor/vendorRoutes');
const flavorRoutes = require('./routes/vendor/flavorRoutes');
const drumRoutes = require('./routes/vendor/drumRoutes');
const deliveryRoutes = require('./routes/vendor/deliveryRoutes');
const sharedFlavorRoutes = require('./routes/shared/flavorRoutes');
const customerRoutes = require('./routes/customer/customerRoutes');
const notificationRoutes = require('./routes/shared/notificationRoutes');
const autoReturnRoutes = require('./routes/admin/autoReturnRoutes');
const ratingRoutes = require('./routes/shared/ratingRoutes');
const cartRoutes = require('./routes/shared/cartRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const feedbackRoutes = require('./routes/feedback');
const passwordResetRoutes = require('./routes/shared/passwordResetRoutes');
const testEmailRoutes = require('./routes/testEmailRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { validateRequiredFields, trimObjectStrings } = require('./utils/validation');

const app = express();

// CORS Configuration for production (Railway + Vercel)
const allowedOrigins = [
  'http://localhost:3000', // Local development
  'http://127.0.0.1:3000', 
  'https://chillneticecream.vercel.app', // Production Vercel URL
  process.env.FRONTEND_URL, // Vercel production URL (set in Railway env vars)
  /\.vercel\.app$/, // All Vercel preview deployments
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/, // Local network testing
];

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    console.log(`[CORS] Request from origin: ${origin}`);
    
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      console.log('[CORS] No origin provided, allowing request');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      }
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed || process.env.NODE_ENV === 'development') {
      console.log(`[CORS] Origin ${origin} is allowed`);
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      console.warn(`[CORS] Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
app.use(vendorPassport.initialize());
app.use(vendorPassport.session());

app.use(express.json());
app.use(express.urlencoded({extended:true}))

// Serve uploaded files for legacy support (Cloudinary is primary storage)
// Note: New uploads go to Cloudinary, but we serve old local files for backward compatibility
app.use('/uploads', express.static('uploads'));

// Dev aid: confirm admin env presence on startup (won't print password)
if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    console.log(`[auth] Admin credentials loaded for username: '${String(process.env.ADMIN_USERNAME).trim()}'`);
} else {
    console.log('[auth] Admin credentials not set in .env');
}

app.get("/", (req, res) => {
    res.send("Hello from backend");
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/vendor/auth', vendorGoogleAuthRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminLocationRoutes);
app.use('/api/admin/subscription', require('./routes/admin/subscriptionRoutes'));
app.use('/api/vendor', vendorRoutes);
app.use('/api/vendor/flavors', flavorRoutes);
app.use('/api/vendor/drums', drumRoutes);
app.use('/api/vendor/delivery', deliveryRoutes);
app.use('/api/flavors', sharedFlavorRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/auto-return', autoReturnRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api', reviewRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/test', testEmailRoutes);
app.use('/api/payments', paymentRoutes);

// app.get('/users', async (req, res) => {
//     try {
//         const [rows] = await pool.query('SELECT * FROM users');
//         res.json(rows);
//     } catch (err) {
//         console.error('GET /users failed:', err.code, err.message);
//         res.status(500).json({
//             error: 'Database error',
//             code: err.code,
//             message: process.env.NODE_ENV === 'development' ? err.message : undefined
//         });
//     }
// });


app.get('/db/health', async (req, res) => {
    try {
        await pool.query('SELECT 1 AS ok');
        res.json({ ok: true });
    } catch (err) {
        console.error('DB health check failed:', err.code, err.message);
        res.status(500).json({
            ok: false,
            error: 'Database error',
            code: err.code,
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// app.post('/login', async (req, res) => {
//     try {
//         const { username, password } = req.body || {};
//         if (!username || !password) {
//             return res.status(400).json({ error: 'Missing username or password' });
//         }

//         // Allow a single admin account via env without relying on DB
//         const adminUsername = process.env.ADMIN_USERNAME;
//         const adminPassword = process.env.ADMIN_PASSWORD;
//         const inputUser = String(username).trim();
//         const inputPass = String(password);
//         const envUser = adminUsername ? String(adminUsername).trim() : null;
//         const envPass = adminPassword ? String(adminPassword) : null;
//         if (envUser && envPass && inputUser === envUser && inputPass === envPass) {
//             return res.json({
//                 message: 'Login successful',
//                 user: {
//                     id: 0,
//                     username: envUser,
//                     firstName: 'Admin',
//                     lastName: '',
//                     role: 'admin'
//                 }
//             });
//         }

//         // Query user from DB; select * to allow optional role column
//         const [rows] = await pool.query(
//             'SELECT * FROM users WHERE username = ? LIMIT 1',
//             [username]
//         );
//         if (!rows || rows.length === 0) {
//             return res.status(401).json({ error: 'Invalid credentials' });
//         }

//         const user = rows[0];
//         if (user.password !== password) {
//             return res.status(401).json({ error: 'Invalid credentials' });
//         }

//         const resolvedRole = user.role || user.user_role || null; // support various schemas
//         return res.json({
//             message: 'Login successful',
//             user: {
//                 id: user.user_id,
//                 username: user.username,
//                 firstName: user.fname,
//                 lastName: user.lname,
//                 role: resolvedRole || 'customer'
//             }
//         });
//     } catch (err) {
//         console.error('POST /login failed:', err.code, err.message);
//         return res.status(500).json({
//             error: 'Database error',
//             code: err.code,
//             message: process.env.NODE_ENV === 'development' ? err.message : undefined
//         });
//     }
// });

// ============ AUTOMATIC VENDOR AUTO-RESET BACKGROUND PROCESS ============
const { processVendorAutoReturns } = require('./utils/vendorAutoReturn');

// Start automatic vendor auto-reset checking every 10 seconds
console.log('🚀 Starting vendor auto-reset background process...');
setInterval(async () => {
    try {
        await processVendorAutoReturns();
    } catch (error) {
        console.error('❌ Auto-reset background process error:', error.message);
    }
}, 10000); // Check every 10 seconds

console.log('✅ Auto-reset background process running every 10 seconds');

module.exports = app;