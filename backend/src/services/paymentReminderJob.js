const cron = require('node-cron');
const pool = require('../db/config');
const { createNotification } = require('../controller/shared/notificationController');
const { sendEmail } = require('../utils/emailService');

const logPrefix = '🔔 Payment Reminder:';

const PAYMENT_WINDOW_MINUTES = parseInt(
  process.env.ORDER_PAYMENT_WINDOW_MINUTES || '30',
  10
);

const backfillPendingPayments = async () => {
  try {
    const intervalMinutes = PAYMENT_WINDOW_MINUTES;
    await pool.query(
      `
        INSERT INTO pending_payment_orders (
          order_id,
          payment_deadline,
          reminder_sent,
          created_at,
          updated_at
        )
        SELECT
          o.order_id,
          COALESCE(
            o.payment_deadline,
            DATE_ADD(NOW(), INTERVAL ${intervalMinutes} MINUTE)
          ) as payment_deadline,
          0,
          NOW(),
          NOW()
        FROM orders o
        LEFT JOIN pending_payment_orders ppo ON ppo.order_id = o.order_id
        WHERE ppo.order_id IS NULL
          AND o.payment_status = 'unpaid'
          AND o.status IN ('pending', 'confirmed')
      `
    );
  } catch (error) {
    console.error(`${logPrefix} Failed to backfill pending payment records:`, error);
  }
};

const sendPendingPaymentReminders = async () => {
  try {
    await backfillPendingPayments();

    console.log(`${logPrefix} Checking for pending payment reminders...`);

    const [pendingOrders] = await pool.query(
      `
        SELECT
          ppo.order_id,
          ppo.payment_deadline,
          o.customer_id,
          o.vendor_id,
          o.total_amount,
          o.payment_amount,
          o.remaining_balance,
          o.payment_status,
          u.email,
          u.fname,
          u.lname,
          v.store_name,
          TIMESTAMPDIFF(SECOND, NOW(), ppo.payment_deadline) AS seconds_remaining
        FROM pending_payment_orders ppo
        INNER JOIN orders o ON ppo.order_id = o.order_id
        LEFT JOIN users u ON o.customer_id = u.user_id
        LEFT JOIN vendors v ON o.vendor_id = v.vendor_id
        WHERE ppo.reminder_sent = 0
          AND ppo.payment_deadline IS NOT NULL
          AND o.payment_status = 'unpaid'
          AND o.status IN ('pending', 'confirmed')
          AND TIMESTAMPDIFF(SECOND, NOW(), ppo.payment_deadline) > 0
          AND TIMESTAMPDIFF(MINUTE, NOW(), ppo.payment_deadline) <= ?
      `,
      [PAYMENT_WINDOW_MINUTES]
    );

    if (!pendingOrders.length) {
      console.log(`${logPrefix} No reminders to send.`);
      return;
    }

    for (const order of pendingOrders) {
      const {
        order_id,
        payment_deadline,
        customer_id,
        vendor_id,
        total_amount,
        payment_amount,
        remaining_balance,
        payment_status,
        email,
        fname,
        lname,
        store_name,
        seconds_remaining
      } = order;

      const minutesRemaining = Math.max(
        0,
        Math.ceil((seconds_remaining || 0) / 60)
      );

      console.log(
        `${logPrefix} Sending reminder for order #${order_id}. Time remaining: ${minutesRemaining} minute(s).`
      );

      try {
        if (customer_id) {
          const paymentWindow = PAYMENT_WINDOW_MINUTES;

          await createNotification({
            user_id: customer_id,
            user_type: 'customer',
            title: 'Payment Reminder',
            message: `Please pay for order #${order_id} within ${minutesRemaining} minute(s) to avoid automatic cancellation.`,
            notification_type: 'payment_reminder',
            related_order_id: order_id,
            related_vendor_id: vendor_id,
            related_customer_id: customer_id
          });

          console.log(
            `${logPrefix} Notification queued for customer ${customer_id} on order #${order_id}.`
          );

          if (email) {
            const customerName = [fname, lname].filter(Boolean).join(' ').trim() || null;

            const totalAmountValue = Number(total_amount) || 0;
            const paymentAmountValue =
              payment_amount !== null && payment_amount !== undefined
                ? Number(payment_amount)
                : totalAmountValue;
            let isPartial = false;
            let amountDueValue = paymentAmountValue;
            let remainingBalanceValue = null;
            let partialPercentage = null;

            if (
              totalAmountValue > 0 &&
              paymentAmountValue > 0 &&
              paymentAmountValue < totalAmountValue
            ) {
              isPartial = true;
              remainingBalanceValue =
                remaining_balance !== null && remaining_balance !== undefined
                  ? Number(remaining_balance)
                  : Math.max(totalAmountValue - paymentAmountValue, 0);
              partialPercentage = Math.round((paymentAmountValue / totalAmountValue) * 100);
            } else if (payment_status === 'partial') {
              // Fallback for orders already marked partial but without differing amounts
              isPartial = true;
            } else {
              amountDueValue = totalAmountValue;
            }

            const paymentInstructions =
              isPartial && partialPercentage !== null
                ? `Initial payment (${partialPercentage}%): Please pay now to confirm your order. Remaining balance will be collected on delivery.`
                : null;

            await sendEmail(email, 'orderPaymentReminder', {
              orderId: order_id,
              customerName,
              vendorName: store_name,
              totalAmount: amountDueValue,
              isPartial,
              partialPercentage,
              remainingBalance: remainingBalanceValue,
              paymentDeadline: payment_deadline,
              paymentWindowMinutes: paymentWindow,
              paymentInstructions
            });

            console.log(
              `${logPrefix} Email dispatched to ${email} for order #${order_id}.`
            );
          } else {
            console.warn(
              `${logPrefix} No email on file for customer ${customer_id} (order #${order_id}). Skipping email reminder.`
            );
          }
        }

        await pool.query(
          `
            UPDATE pending_payment_orders
            SET reminder_sent = 1,
                updated_at = NOW()
            WHERE order_id = ?
          `,
          [order_id]
        );
      } catch (reminderError) {
        console.error(
          `${logPrefix} Failed to send reminder for order #${order_id}:`,
          reminderError
        );
      }
    }
  } catch (error) {
    console.error(`${logPrefix} Error processing payment reminders:`, error);
  }
};

if (typeof cron !== 'undefined' && cron.schedule) {
  cron.schedule('* * * * *', sendPendingPaymentReminders);
  console.log(`${logPrefix} Job scheduled to run every minute.`);
} else {
  console.warn(`${logPrefix} Cron not available - payment reminder job not started.`);
}

// Run once on startup
sendPendingPaymentReminders();

module.exports = {
  sendPendingPaymentReminders
};

