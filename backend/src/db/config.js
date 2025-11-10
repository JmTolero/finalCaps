const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const rawPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chill_db',
    port: process.env.DB_PORT || 3306,
    timezone: '+08:00', // Set to Philippine timezone
    dateStrings: false, // Return dates as Date objects
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

rawPool.on('connection', (connection) => {
    connection.query("SET time_zone = '+08:00'");
});

const pool = rawPool.promise();

module.exports = pool;