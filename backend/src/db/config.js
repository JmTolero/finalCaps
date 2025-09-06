const mysql = require('mysql2');


const pool = mysql.createPool({
    host: process.env.host || 'localhost',
    user: process.env.user || 'root',
    password: process.env.password || '',
    database: process.env.db_name || 'chillnet_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

module.exports = pool;