const pool = require('../../db/config');
const { validateRequiredFields, trimObjectStrings } = require('../../utils/validation');

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
            return res.json({
                message: 'Login successful',
                user: {
                    id: 0,
                    username: envUser,
                    firstName: 'Admin',
                    lastName: '',
                    role: 'admin'
                }
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
        return res.json({
            message: 'Login successful',
            user: {
                id: user.user_id,
                username: user.username,
                firstName: user.fname,
                lastName: user.lname,
                email: user.email,
                contact_no: user.contact_no,
                role: resolvedRole || 'customer'
            }
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

module.exports = { userLogin };
