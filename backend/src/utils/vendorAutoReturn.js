const pool = require('../db/config');
const { createNotification } = require('../controller/shared/notificationController');
const fs = require('fs').promises;
const path = require('path');

/**
 * Delete physical vendor document files from uploads directory
 * @param {Object} vendorData - Vendor data containing file URLs
 */
const deleteVendorFiles = async (vendorData) => {
    const uploadDir = path.join(__dirname, '../../uploads/vendor-documents');
    
    try {
        // List of potential file fields to delete
        const fileFields = ['valid_id_url', 'business_permit_url', 'proof_image_url', 'profile_image_url'];
        
        for (const field of fileFields) {
            const fileName = vendorData[field];
            if (fileName && fileName.trim() !== '') {
                const filePath = path.join(uploadDir, fileName);
                
                try {
                    await fs.unlink(filePath);
                    console.log(`🗑️ Deleted file: ${fileName}`);
                } catch (error) {
                    if (error.code !== 'ENOENT') {
                        console.error(`❌ Error deleting file ${fileName}:`, error.message);
                    }
                    // Don't throw error if file doesn't exist (ENOENT)
                }
            }
        }
        
        console.log(`✅ File cleanup completed for vendor ${vendorData.vendor_id}`);
        
    } catch (error) {
        console.error(`❌ Error during file cleanup for vendor ${vendorData.vendor_id}:`, error.message);
    }
};

/**
 * Check for vendors that should be automatically returned after 1 week of rejection
 * This function should be called periodically (e.g., daily via cron job)
 */
const processVendorAutoReturns = async () => {
    try {
        console.log('🔄 Processing vendor auto-returns...');
        
        // Find vendors that are eligible for auto-return (SIMPLIFIED and ROBUST)
        const [eligibleRejections] = await pool.query(`
            SELECT 
                vr.vendor_id,
                vr.user_id,
                vr.rejection_id,
                vr.auto_return_at,
                COALESCE(v.store_name, 'No Store Name') as store_name,
                v.valid_id_url,
                v.business_permit_url,
                v.proof_image_url,
                v.profile_image_url,
                u.fname,
                u.lname,
                u.email
            FROM vendor_rejections vr
            LEFT JOIN vendors v ON vr.vendor_id = v.vendor_id
            LEFT JOIN users u ON vr.user_id = u.user_id
            WHERE vr.is_returned = FALSE 
            AND vr.auto_return_at <= NOW()
        `);
        
        console.log(`Found ${eligibleRejections.length} vendors eligible for auto-return`);
        
        for (const rejection of eligibleRejections) {
            try {
                // STEP 1: Delete physical files first
                console.log(`🗑️ Deleting physical files for vendor ${rejection.vendor_id}...`);
                await deleteVendorFiles(rejection);
                
                // STEP 2: DELETE the vendor application record completely
                await pool.query(
                    'DELETE FROM vendors WHERE vendor_id = ?',
                    [rejection.vendor_id]
                );
                
                // Mark rejection as returned
                await pool.query(
                    'UPDATE vendor_rejections SET is_returned = TRUE, returned_at = NOW() WHERE rejection_id = ?',
                    [rejection.rejection_id]
                );
                
                // Create notification for vendor (COMPLETE RESET)
                await createNotification({
                    user_id: rejection.user_id,
                    user_type: 'vendor',
                    title: 'Fresh Start Available! 🆕',
                    message: `Hello ${rejection.fname}! Your vendor application has been completely reset. You now have a clean slate and can submit a brand new application with fresh documents. Please reapply from scratch.`,
                    notification_type: 'system_announcement',
                    related_vendor_id: rejection.vendor_id
                });
                
                console.log(`✅ Auto-reset vendor ${rejection.vendor_id} (${rejection.fname} ${rejection.lname}) - Complete data wipe completed`);
                
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

/**
 * Manually trigger the auto-reset process (for testing)
 * This will process any vendors that are past their auto-return time
 */
const triggerAutoReset = async () => {
    try {
        console.log('🚀 Manually triggering vendor auto-reset process...');
        await processVendorAutoReturns();
        return { success: true, message: 'Auto-reset process completed' };
    } catch (error) {
        console.error('❌ Error in manual auto-reset trigger:', error);
        return { success: false, message: error.message };
    }
};

module.exports = {
    processVendorAutoReturns,
    getVendorsInRejectionPeriod,
    getVendorRejectionStats,
    triggerAutoReset
};
