const pool = require('./src/db/config');

async function checkVendorProfile() {
    try {
        const [rows] = await pool.query('SELECT user_id, fname, lname, email, role, profile_image_url FROM users WHERE user_id = 95');
        console.log('User 95 Data:');
        console.log(JSON.stringify(rows, null, 2));
        process.exit();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkVendorProfile();

