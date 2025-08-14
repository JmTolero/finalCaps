const { createPool } = require('mysql2');
require('dotenv').config(); // if using .env file

 const pool = createPool({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.db_name
});

pool.query('SELECT * FROM users', (err, result, fields) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(result); // your data
});

module.exports = pool