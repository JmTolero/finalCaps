const pool = require('../../db/config');
const { validateRequiredFields, trimObjectStrings } = require('../../utils/validation');
const { generateToken } = require('../../utils/jwt');

// Register new customer
const registerCustomer = async (req, res) => {
    try {
        // Trim input values
        const trimmedBody = trimObjectStrings(req.body || {});
        const { firstname, lastname, username, password, contact, email, birth_date, gender } = trimmedBody;
        
        // Validate required fields
        const requiredFields = [
            { key: 'firstname', name: 'First name' },
            { key: 'lastname', name: 'Last name' },
            { key: 'username', name: 'Username' },
            { key: 'password', name: 'Password' },
            { key: 'contact', name: 'Contact number' },
            { key: 'email', name: 'Email' },
            { key: 'birth_date', name: 'Birth date' },
            { key: 'gender', name: 'Gender' }
        ];
        
        const validation = validateRequiredFields(trimmedBody, requiredFields);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.message });
        }

        // Check if email already exists
        const [existingEmail] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Check if username already exists
        const [existingUsername] = await pool.query('SELECT user_id FROM users WHERE username = ?', [username]);
        if (existingUsername.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Insert new customer user
        const [userResult] = await pool.query(
            'INSERT INTO users (fname, lname, username, password, contact_no, email, birth_date, gender, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [firstname, lastname, username, password, contact, email, birth_date, gender, 'customer']
        );

        const userId = userResult.insertId;

        console.log('Customer registration successful:', userId);

        return res.json({
            message: 'Registration successful',
            user: {
                id: userId,
                username: username,
                firstName: firstname,
                lastName: lastname,
                email: email,
                contact_no: contact,
                role: 'customer'
            }
        });
    } catch (err) {
        console.error('POST /register failed:', err.code, err.message);
        return res.status(500).json({
            error: 'Database error',
            code: err.code,
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

const userLogin = async (req, res) => {
    try {
        // Trim input values
        const trimmedBody = trimObjectStrings(req.body || {});
        const { username, password } = trimmedBody;
        
        // Validate required fields
        const requiredFields = [
            { key: 'username', name: 'Username' },
            { key: 'password', name: 'Password' }
        ];
        
        const validation = validateRequiredFields(trimmedBody, requiredFields);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.message });
        }

        // Allow a single admin account via env without relying on DB
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const inputUser = String(username).trim();
        const inputPass = String(password);
        const envUser = adminUsername ? String(adminUsername).trim() : null;
        const envPass = adminPassword ? String(adminPassword) : null;
        if (envUser && envPass && inputUser === envUser && inputPass === envPass) {
            const adminUser = {
                id: 0,
                username: envUser,
                firstName: 'Admin',
                lastName: '',
                role: 'admin'
            };
            
            const token = generateToken(adminUser);
            
            return res.json({
                message: 'Login successful',
                user: adminUser,
                token: token
            });
        }

        // Query user from DB; select * to allow optional role column
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1',[username]);

        if (!rows || rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check account status
        const userStatus = user.status || 'active'; // default to active for existing users
        if (userStatus === 'inactive') {
            return res.status(403).json({ error: 'Account has been deactivated. Please contact support.' });
        }
        if (userStatus === 'suspended') {
            return res.status(403).json({ error: 'Account has been suspended. Please contact support.' });
        }

        const resolvedRole = user.role || user.user_role || null; // support various schemas
        const userData = {
            id: user.user_id,
            username: user.username,
            firstName: user.fname,
            lastName: user.lname,
            email: user.email,
            contact_no: user.contact_no,
            role: resolvedRole || 'customer'
        };
        
        const token = generateToken(userData);
        
        return res.json({
            message: 'Login successful',
            user: userData,
            token: token
        });
    } catch (err) {
        console.error('POST /login failed:', err.code, err.message);
        return res.status(500).json({
            error: 'Database error',
            code: err.code,
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}

module.exports = { userLogin, registerCustomer };
