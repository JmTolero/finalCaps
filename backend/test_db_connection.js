require('dotenv').config();
const pool = require('./src/db/config');

async function testConnection() {
    try {
        console.log('Testing database connection...');
        console.log('Environment variables:');
        console.log('host:', process.env.host || 'localhost');
        console.log('user:', process.env.user || 'root');
        console.log('password:', process.env.password ? '***' : '(empty)');
        console.log('database:', process.env.db_name || 'chill_db');
        
        // Test basic connection
        const connection = await pool.getConnection();
        console.log('✅ Database connection successful!');
        
        // Test a simple query
        const [rows] = await connection.query('SELECT 1 as test');
        console.log('✅ Database query successful:', rows);
        
        // Test users table exists
        const [tables] = await connection.query('SHOW TABLES LIKE "users"');
        if (tables.length > 0) {
            console.log('✅ Users table exists');
            
            // Test users table structure
            const [columns] = await connection.query('DESCRIBE users');
            console.log('Users table columns:', columns.map(col => col.Field).join(', '));
        } else {
            console.log('❌ Users table does not exist');
        }
        
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testConnection();
