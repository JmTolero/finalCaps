const express = require("express");
const cors = require("cors");
const pool = require('./db/config');
// Import new organized routes
const authRoutes = require('./routes/shared/authRoutes');
const orderRoutes = require('./routes/shared/orderRoutes');
const addressRoutes = require('./routes/shared/addressRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');
const adminLocationRoutes = require('./routes/admin/locationRoutes');
const vendorRoutes = require('./routes/vendor/vendorRoutes');
const { validateRequiredFields, trimObjectStrings } = require('./utils/validation');

const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}))

// Serve uploaded files
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
app.use('/api', orderRoutes);
app.use('/api', addressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminLocationRoutes);
app.use('/api/vendor', vendorRoutes);

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

app.post('/register', async (req, res) => {
    try {
        // Trim all string values
        const trimmedBody = trimObjectStrings(req.body || {});
        const { firstname, lastname, username, password, confirm, contact, email } = trimmedBody;

        // Validate required fields for empty/whitespace values
        const requiredFields = [
            { key: 'firstname', name: 'First name' },
            { key: 'lastname', name: 'Last name' },
            { key: 'username', name: 'Username' },
            { key: 'password', name: 'Password' },
            { key: 'contact', name: 'Contact number' },
            { key: 'email', name: 'Email' }
        ];

        const validation = validateRequiredFields(trimmedBody, requiredFields);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.message });
        }

        if (confirm !== undefined && confirm !== password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Check for existing user by username or email
        const [existing] = await pool.query(
            'SELECT user_id FROM users WHERE username = ? OR email = ? LIMIT 1',
            [username, email]
        );
        if (existing && existing.length > 0) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // NOTE: For production, hash the password with bcrypt.
        // In this starter, we store as plain text to avoid extra deps. Replace when ready.
        const [result] = await pool.query(
            'INSERT INTO users (fname, lname, username, password, contact_no, email) VALUES (?, ?, ?, ?, ?, ?)',
            [firstname, lastname, username, password, contact, email]
        );

        return res.status(201).json({ id: result.insertId, message: 'User registered successfully' });
    } catch (err) {
        console.error('POST /register failed:', err.code, err.message);
        return res.status(500).json({
            error: 'Database error',
            code: err.code,
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

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

module.exports = app;