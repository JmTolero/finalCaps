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

const enforceFreePlanDrumLimit = async (vendorId, limit = FREE_PLAN_LIMITS.drums) => {
  if (limit === -1) {
    return {
      affectedRows: 0,
      adjustments: [],
      finalStock: {
        small: null,
        medium: null,
        large: null
      }
    };
  }

  const sizes = ['small', 'medium', 'large'];
  const [drums] = await pool.query(
    `
      SELECT drum_size, stock
      FROM vendor_drum_pricing
      WHERE vendor_id = ?
    `,
    [vendorId]
  );

  const stock = {
    small: 0,
    medium: 0,
    large: 0
  };

  drums.forEach((drum) => {
    if (!sizes.includes(drum.drum_size)) {
      return;
    }

    const numericStock = Number(drum.stock);
    stock[drum.drum_size] = Number.isNaN(numericStock) ? 0 : Math.max(numericStock, 0);
  });

  const totalStock = sizes.reduce((sum, size) => sum + (stock[size] || 0), 0);

  if (totalStock <= limit) {
    return {
      affectedRows: 0,
      adjustments: [],
      finalStock: { ...stock }
    };
  }

  const activeSizes = sizes.filter((size) => stock[size] > 0);
  const minimumPerSize = {};

  if (limit >= activeSizes.length) {
    activeSizes.forEach((size) => {
      minimumPerSize[size] = 1;
    });
  } else {
    // Not enough allowance to give every active size at least one drum.
    // Prioritize smaller drums to keep stores functional.
    const priorityForMinimum = ['small', 'medium', 'large'];
    let allowance = limit;
    priorityForMinimum.forEach((size) => {
      if (stock[size] > 0 && allowance > 0) {
        minimumPerSize[size] = 1;
        allowance -= 1;
      } else {
        minimumPerSize[size] = 0;
      }
    });
  }

  let finalStock = { ...stock };
  let overage = totalStock - limit;
  const reductionPriority = ['large', 'medium', 'small'];

  while (overage > 0) {
    let reducedInPass = false;

    for (const size of reductionPriority) {
      const minAllowed = minimumPerSize[size] || 0;
      if (finalStock[size] > minAllowed) {
        const maxReduction = finalStock[size] - minAllowed;
        const reduction = Math.min(maxReduction, overage);

        finalStock[size] -= reduction;
        overage -= reduction;
        reducedInPass = true;

        if (overage === 0) {
          break;
        }
      }
    }

    if (!reducedInPass) {
      break;
    }
  }

  // If we still have overage (edge cases), trim without respecting minimums using same priority.
  if (overage > 0) {
    for (const size of reductionPriority) {
      if (finalStock[size] > 0) {
        const reduction = Math.min(finalStock[size], overage);
        finalStock[size] -= reduction;
        overage -= reduction;

        if (overage === 0) {
          break;
        }
      }
    }
  }

  const adjustments = [];
  const dailyAdjustments = [];
  let affectedRows = 0;

  for (const size of sizes) {
    if (finalStock[size] !== stock[size]) {
      const [result] = await pool.query(
        `
          UPDATE vendor_drum_pricing
          SET stock = ?
          WHERE vendor_id = ? AND drum_size = ?
        `,
        [finalStock[size], vendorId, size]
      );

      adjustments.push({
        drum_size: size,
        from: stock[size],
        to: finalStock[size]
      });

      affectedRows += result.affectedRows || 0;
    }

    if (finalStock[size] < stock[size]) {
      const [availabilityRows] = await pool.query(
        `
          SELECT availability_id, delivery_date, total_capacity, reserved_count, booked_count, available_count
          FROM daily_drum_availability
          WHERE vendor_id = ? AND drum_size = ? AND delivery_date >= CURDATE()
        `,
        [vendorId, size]
      );

      for (const availability of availabilityRows) {
        const totalCapacity = Number(availability.total_capacity) || 0;
        const reservedCount = Number(availability.reserved_count) || 0;
        const bookedCount = Number(availability.booked_count) || 0;

        const desiredTotal = Math.min(finalStock[size], totalCapacity);
        const minimumCapacity = reservedCount + bookedCount;
        const updatedTotal = Math.max(minimumCapacity, desiredTotal);
        const updatedAvailable = Math.max(0, updatedTotal - reservedCount - bookedCount);

        if (
          updatedTotal !== totalCapacity ||
          updatedAvailable !== Number(availability.available_count || 0)
        ) {
          await pool.query(
            `
              UPDATE daily_drum_availability
              SET total_capacity = ?, available_count = ?
              WHERE availability_id = ?
            `,
            [updatedTotal, updatedAvailable, availability.availability_id]
          );

          dailyAdjustments.push({
            availability_id: availability.availability_id,
            drum_size: size,
            delivery_date: availability.delivery_date,
            from: {
              total_capacity: totalCapacity,
              available_count: Number(availability.available_count) || 0
            },
            to: {
              total_capacity: updatedTotal,
              available_count: updatedAvailable
            }
          });
        }
      }
    }
  }

  return {
    affectedRows,
    adjustments,
    finalStock,
    dailyAdjustments
  };
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
  const drumAdjustment = await enforceFreePlanDrumLimit(vendorId);

  return {
    vendorResult: result,
    flavorAdjustment,
    drumAdjustment
  };
};

module.exports = {
  FREE_PLAN_LIMITS,
  hasSubscriptionExpired,
  downgradeVendorToFree,
  enforceFreePlanFlavorLimit,
  enforceFreePlanDrumLimit
};

