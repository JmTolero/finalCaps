const pool = require('../db/config');
const { createNotification } = require('../controller/shared/notificationController');

/**
 * Check for vendors that should be automatically returned after 1 week of rejection
 * This function should be called periodically (e.g., daily via cron job)
 */
const processVendorAutoReturns = async () => {
    try {
        console.log('🔄 Processing vendor auto-returns...');
        
        // Find vendors that are eligible for auto-return
        const [eligibleRejections] = await pool.query(`
            SELECT 
                vr.*,
                v.vendor_id,
                v.user_id,
                u.fname,
                u.lname,
                u.email
            FROM vendor_rejections vr
            JOIN vendors v ON vr.vendor_id = v.vendor_id
            JOIN users u ON vr.user_id = u.user_id
            WHERE vr.is_returned = FALSE 
            AND vr.auto_return_at <= NOW()
            AND v.status = 'rejected'
        `);
        
        console.log(`Found ${eligibleRejections.length} vendors eligible for auto-return`);
        
        for (const rejection of eligibleRejections) {
            try {
                // Update vendor status back to pending
                await pool.query(
                    'UPDATE vendors SET status = ? WHERE vendor_id = ?',
                    ['pending', rejection.vendor_id]
                );
                
                // Mark rejection as returned
                await pool.query(
                    'UPDATE vendor_rejections SET is_returned = TRUE, returned_at = NOW() WHERE rejection_id = ?',
                    [rejection.rejection_id]
                );
                
                // Create notification for vendor
                await createNotification({
                    user_id: rejection.user_id,
                    user_type: 'vendor',
                    title: 'Reapplication Available! 🔄',
                    message: `Hello ${rejection.fname}! You can now reapply for vendor status. Your previous application has been reset to pending status. Please review and improve your application if needed.`,
                    notification_type: 'system_announcement',
                    related_vendor_id: rejection.vendor_id
                });
                
                console.log(`✅ Auto-returned vendor ${rejection.vendor_id} (${rejection.fname} ${rejection.lname})`);
                
            } catch (error) {
                console.error(`❌ Error processing auto-return for vendor ${rejection.vendor_id}:`, error);
            }
        }
        
        console.log(`🎯 Auto-return process completed. Processed ${eligibleRejections.length} vendors.`);
        
    } catch (error) {
        console.error('❌ Error in vendor auto-return process:', error);
    }
};

/**
 * Get vendors that are currently in rejection period (not yet eligible for auto-return)
 */
const getVendorsInRejectionPeriod = async () => {
    try {
        const [rejections] = await pool.query(`
            SELECT 
                vr.*,
                v.vendor_id,
                u.fname,
                u.lname,
                u.email,
                DATEDIFF(vr.auto_return_at, NOW()) as days_until_return
            FROM vendor_rejections vr
            JOIN vendors v ON vr.vendor_id = v.vendor_id
            JOIN users u ON vr.user_id = u.user_id
            WHERE vr.is_returned = FALSE 
            AND vr.auto_return_at > NOW()
            AND v.status = 'rejected'
            ORDER BY vr.auto_return_at ASC
        `);
        
        return rejections;
    } catch (error) {
        console.error('Error fetching vendors in rejection period:', error);
        return [];
    }
};

/**
 * Get statistics about vendor rejections and auto-returns
 */
const getVendorRejectionStats = async () => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_rejections,
                SUM(CASE WHEN is_returned = TRUE THEN 1 ELSE 0 END) as returned_count,
                SUM(CASE WHEN is_returned = FALSE AND auto_return_at <= NOW() THEN 1 ELSE 0 END) as eligible_for_return,
                SUM(CASE WHEN is_returned = FALSE AND auto_return_at > NOW() THEN 1 ELSE 0 END) as in_rejection_period
            FROM vendor_rejections
        `);
        
        return stats[0] || {
            total_rejections: 0,
            returned_count: 0,
            eligible_for_return: 0,
            in_rejection_period: 0
        };
    } catch (error) {
        console.error('Error fetching vendor rejection stats:', error);
        return {
            total_rejections: 0,
            returned_count: 0,
            eligible_for_return: 0,
            in_rejection_period: 0
        };
    }
};

module.exports = {
    processVendorAutoReturns,
    getVendorsInRejectionPeriod,
    getVendorRejectionStats
};
