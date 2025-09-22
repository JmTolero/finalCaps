const { processVendorAutoReturns } = require('./utils/vendorAutoReturn');

/**
 * Run all scheduled jobs
 * This function should be called periodically (e.g., daily via cron job)
 */
const runScheduledJobs = async () => {
    console.log('🚀 Starting scheduled jobs...');
    
    try {
        // Process vendor auto-returns
        await processVendorAutoReturns();
        
        // Add other scheduled jobs here in the future
        // e.g., cleanup old notifications, send reminders, etc.
        
        console.log('✅ All scheduled jobs completed successfully');
    } catch (error) {
        console.error('❌ Error running scheduled jobs:', error);
    }
};

/**
 * Run scheduled jobs if this file is executed directly
 * This allows the script to be run manually for testing
 */
if (require.main === module) {
    runScheduledJobs()
        .then(() => {
            console.log('Scheduled jobs finished');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Scheduled jobs failed:', error);
            process.exit(1);
        });
}

module.exports = {
    runScheduledJobs
};
