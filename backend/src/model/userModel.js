const pool  = require("../db/config")



const User = {

    getAll: async () => {
        const [rows] = await pool.query(
            `
        SELECT 
        (SELECT COUNT(*) FROM users) AS totalUsers,
        (SELECT COUNT(*) FROM vendors) AS totalVendors,
        (SELECT COUNT(*) FROM orders) AS totalOrders
        `);
        return rows;
    }


    // countTotalUsers: async () => {
    //     const [rows] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users");
    //     return rows;
    // },

    // countTotalVendors: async () => {
    //     const [rows] = await pool.query("Select COUNT(*) AS totalVendors from vendors");
    //     return rows;
    // }
}
// -----------------------------------------------------------------------------



module.exports = { User }