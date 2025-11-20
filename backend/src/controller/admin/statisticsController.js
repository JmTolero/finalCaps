const pool = require('../../db/config');

// Get comprehensive subscription statistics for admin dashboard
const getSubscriptionStatistics = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // Get overview statistics
            const [overview] = await connection.query(`
                SELECT 
                    (SELECT COUNT(*) FROM users WHERE role = 'customer') as totalCustomers,
                    (SELECT COUNT(*) FROM vendors) as totalVendors,
                    (SELECT COUNT(*) FROM vendors WHERE status = 'approved') as approvedVendors,
                    (SELECT COUNT(*) FROM orders) as totalOrders,
                    (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as deliveredOrders,
                    (SELECT COALESCE(SUM(amount), 0) FROM subscription_payments WHERE payment_status = 'paid') as totalSubscriptionRevenue,
                    (SELECT COUNT(*) FROM subscription_payments WHERE payment_status = 'paid') as totalPaidSubscriptions,
                    (SELECT COUNT(*) FROM subscription_payments WHERE payment_status = 'pending') as pendingPayments
            `);

            // Get subscription revenue by plan
            const [revenueByPlan] = await connection.query(`
                SELECT 
                    plan_name,
                    COUNT(*) as subscriptionCount,
                    COALESCE(SUM(amount), 0) as totalRevenue
                FROM subscription_payments
                WHERE payment_status = 'paid'
                GROUP BY plan_name
                ORDER BY totalRevenue DESC
            `);

            // Get subscription payment status distribution
            const [paymentStatusDist] = await connection.query(`
                SELECT 
                    payment_status,
                    COUNT(*) as count,
                    COALESCE(SUM(amount), 0) as totalAmount
                FROM subscription_payments
                GROUP BY payment_status
            `);

            // Get monthly subscription revenue trend
            const [monthlyRevenue] = await connection.query(`
                SELECT 
                    DATE_FORMAT(payment_date, '%Y-%m') as month,
                    COUNT(*) as subscriptions,
                    COALESCE(SUM(amount), 0) as revenue
                FROM subscription_payments
                WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                    AND payment_status = 'paid'
                GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
                ORDER BY month ASC
            `);

            // Get vendor subscription status distribution
            const [vendorSubscriptionStatus] = await connection.query(`
                SELECT 
                    COALESCE(subscription_plan, 'free') as plan,
                    COUNT(*) as vendorCount
                FROM vendors
                WHERE status = 'approved'
                GROUP BY subscription_plan
            `);

            connection.release();

            res.json({
                success: true,
                data: {
                    overview: overview[0],
                    revenueByPlan,
                    paymentStatusDist,
                    monthlyRevenue,
                    vendorSubscriptionStatus
                }
            });

        } catch (err) {
            connection.release();
            throw err;
        }

    } catch (err) {
        console.error('Failed to fetch subscription statistics:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscription statistics',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

// Get live subscription statistics (for real-time updates)
const getLiveSubscriptionStats = async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM subscription_payments 
                 WHERE DATE(created_at) = CURDATE()) as todayPayments,
                (SELECT COALESCE(SUM(amount), 0) FROM subscription_payments 
                 WHERE DATE(payment_date) = CURDATE() AND payment_status = 'paid') as todayRevenue,
                (SELECT COUNT(*) FROM subscription_payments 
                 WHERE payment_status = 'pending') as pendingPayments,
                (SELECT COUNT(*) FROM vendors 
                 WHERE status = 'approved' AND (subscription_plan IS NULL OR subscription_plan = 'free')) as freeVendors,
                (SELECT COUNT(*) FROM vendors 
                 WHERE status = 'approved' AND subscription_plan != 'free' 
                 AND subscription_plan IS NOT NULL) as paidVendors
        `);

        res.json({
            success: true,
            data: stats[0]
        });

    } catch (err) {
        console.error('Failed to fetch live subscription stats:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch live subscription stats',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

module.exports = {
    getSubscriptionStatistics,
    getLiveSubscriptionStats
};

