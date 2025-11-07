const cron = require('node-cron');
const pool = require('../db/config');
const {
  FREE_PLAN_LIMITS,
  hasSubscriptionExpired,
  downgradeVendorToFree
} = require('./subscriptionMaintenance');

const logPrefix = '📅 Subscription Expiry:';

const downgradeExpiredSubscriptions = async () => {
  try {
    console.log(`${logPrefix} Checking for expired vendor subscriptions...`);

    const [expiredVendors] = await pool.query(
      `
        SELECT vendor_id, subscription_plan, subscription_end_date
        FROM vendors
        WHERE subscription_plan <> 'free'
          AND subscription_end_date IS NOT NULL
      `
    );

    if (!expiredVendors.length) {
      console.log(`${logPrefix} No subscriptions to evaluate.`);
      return;
    }

    const now = new Date();
    let downgradedCount = 0;

    for (const vendor of expiredVendors) {
      if (!hasSubscriptionExpired(vendor.subscription_end_date, now)) {
        continue;
      }

      const { flavorAdjustment } = await downgradeVendorToFree(vendor.vendor_id);
      downgradedCount += 1;
      console.log(
        `${logPrefix} Vendor ${vendor.vendor_id} downgraded to free plan (expired on ${vendor.subscription_end_date}).`
      );

      if (flavorAdjustment?.affectedRows) {
        console.log(
          `${logPrefix} Removed ${flavorAdjustment.affectedRows} flavor${flavorAdjustment.affectedRows > 1 ? 's' : ''} from store for vendor ${vendor.vendor_id} to satisfy free plan limit.`
        );
      }
    }

    if (downgradedCount === 0) {
      console.log(`${logPrefix} No expired subscriptions found.`);
    } else {
      console.log(
        `${logPrefix} Downgraded ${downgradedCount} vendor subscription${downgradedCount > 1 ? 's' : ''} to free plan.`
      );
    }
  } catch (error) {
    console.error(`${logPrefix} Failed to downgrade expired subscriptions:`, error);
  }
};

if (typeof cron !== 'undefined' && cron.schedule) {
  cron.schedule('0 2 * * *', downgradeExpiredSubscriptions);
  console.log(`${logPrefix} Job scheduled to run daily at 02:00.`);
} else {
  console.warn(`${logPrefix} Cron not available - subscription expiry job not started.`);
}

// Run once on startup to catch overdue subscriptions immediately
downgradeExpiredSubscriptions();

module.exports = {
  downgradeExpiredSubscriptions,
  FREE_PLAN_LIMITS
};

