const pool = require('./src/db/config');

async function checkOrder131() {
    try {
        const [rows] = await pool.query('SELECT order_id, customer_id, vendor_id, status, payment_status FROM orders WHERE order_id = 131');
        console.log('Order 131:');
        console.log(JSON.stringify(rows, null, 2));
        process.exit();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkOrder131();
