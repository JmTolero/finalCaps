const pool = require('../db/config');

const FREE_PLAN_LIMITS = Object.freeze({
  flavors: 5,
  drums: 5,
  orders: 30
});

const hasSubscriptionExpired = (subscriptionEndDate, now = new Date()) => {
  if (!subscriptionEndDate) {
    return false;
  }

  const endOfDay = new Date(subscriptionEndDate);
  endOfDay.setHours(23, 59, 59, 999);

  return endOfDay < now;
};

const enforceFreePlanFlavorLimit = async (vendorId, limit = FREE_PLAN_LIMITS.flavors) => {
  if (limit === -1) {
    return { affectedRows: 0, flavorIds: [] };
  }

  const [publishedFlavors] = await pool.query(
    `
      SELECT flavor_id
      FROM flavors
      WHERE vendor_id = ? AND store_status = 'published'
      ORDER BY created_at DESC, flavor_id DESC
    `,
    [vendorId]
  );

  if (!publishedFlavors.length || publishedFlavors.length <= limit) {
    return { affectedRows: 0, flavorIds: [] };
  }

  const excessFlavors = publishedFlavors.slice(limit).map((flavor) => flavor.flavor_id);

  const [result] = await pool.query(
    `
      UPDATE flavors
      SET store_status = 'ready',
          locked_by_subscription = 1
      WHERE flavor_id IN (?)
    `,
    [excessFlavors]
  );

  return { affectedRows: result.affectedRows || 0, flavorIds: excessFlavors };
};

const downgradeVendorToFree = async (vendorId) => {
  const [result] = await pool.query(
    `
      UPDATE vendors
      SET subscription_plan = 'free',
          flavor_limit = ?,
          drum_limit = ?,
          order_limit = ?,
          subscription_start_date = CURDATE()
      WHERE vendor_id = ?
    `,
    [FREE_PLAN_LIMITS.flavors, FREE_PLAN_LIMITS.drums, FREE_PLAN_LIMITS.orders, vendorId]
  );

  const flavorAdjustment = await enforceFreePlanFlavorLimit(vendorId);

  return {
    vendorResult: result,
    flavorAdjustment
  };
};

module.exports = {
  FREE_PLAN_LIMITS,
  hasSubscriptionExpired,
  downgradeVendorToFree,
  enforceFreePlanFlavorLimit
};

