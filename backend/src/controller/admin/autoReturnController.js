const { 
    processVendorAutoReturns, 
    getVendorsInRejectionPeriod, 
    getVendorRejectionStats 
} = require('../../utils/vendorAutoReturn');

/**
 * Manually trigger vendor auto-return process (for testing/admin use)
 */
const triggerAutoReturn = async (req, res) => {
    try {
        console.log('🔄 Manual trigger of vendor auto-return process');
        
        await processVendorAutoReturns();
        
        res.json({
            success: true,
            message: 'Vendor auto-return process completed successfully'
        });
    } catch (error) {
        console.error('Error in manual auto-return trigger:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process vendor auto-returns',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * Get vendors currently in rejection period
 */
const getRejectionPeriodVendors = async (req, res) => {
    try {
        const vendors = await getVendorsInRejectionPeriod();
        
        res.json({
            success: true,
            vendors: vendors
        });
    } catch (error) {
        console.error('Error fetching rejection period vendors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendors in rejection period',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * Get vendor rejection statistics
 */
const getRejectionStats = async (req, res) => {
    try {
        const stats = await getVendorRejectionStats();
        
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Error fetching rejection stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch rejection statistics',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    triggerAutoReturn,
    getRejectionPeriodVendors,
    getRejectionStats
};
