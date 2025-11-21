const pool = require('../../db/config');

// Get vendor-specific statistics for dashboard graphs
const getVendorStatistics = async (req, res) => {
    try {
        const { vendor_id } = req.params;

        if (!vendor_id) {
            return res.status(400).json({
                success: false,
                error: 'Vendor ID is required'
            });
        }

        // Get orders over time (last 30 days)
        const [ordersOverTime] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as orders
            FROM orders
            WHERE vendor_id = ?
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [vendor_id]);

        // Get revenue over time (last 6 months) 
        const [revenueOverTime] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COALESCE(SUM(CAST(total_amount AS DECIMAL(10,2))), 0) as revenue
            FROM orders
            WHERE vendor_id = ?
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            AND status = 'delivered'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `, [vendor_id]);

        // Get order status distribution
        const [ordersByStatus] = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM orders
            WHERE vendor_id = ?
            GROUP BY status
        `, [vendor_id]);

        // Get top 5 selling flavors
        const [topFlavors] = await pool.query(`
            SELECT 
                f.flavor_name,
                f.sold_count
            FROM flavors f
            WHERE f.vendor_id = ?
            AND f.store_status = 'published'
            ORDER BY f.sold_count DESC
            LIMIT 5
        `, [vendor_id]);

        res.json({
            success: true,
            data: {
                ordersOverTime,
                revenueOverTime,
                ordersByStatus,
                topFlavors
            }
        });

    } catch (err) {
        console.error('Failed to fetch vendor statistics:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendor statistics',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

module.exports = {
    getVendorStatistics
};

