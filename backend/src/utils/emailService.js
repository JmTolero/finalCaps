const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  // Auto-detect environment: Gmail for localhost, Resend for production
  const service = process.env.NODE_ENV === 'production' 
    ? (process.env.EMAIL_SERVICE || 'resend')
    : (process.env.EMAIL_SERVICE || 'gmail'); 
  
  if (service === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else if (service === 'resend') {
    // Use Resend API - much more reliable and developer-friendly
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    return {
      sendMail: async (mailOptions) => {
        const data = {
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
          text: mailOptions.text,
          html: mailOptions.html
        };
        return await resend.emails.send(data);
      }
    };
  } else {
    // Try Gmail with port 465 (SSL) - often works better on cloud platforms
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000, // 15 seconds
      greetingTimeout: 10000,    // 10 seconds
      socketTimeout: 15000,      // 15 seconds
      pool: false // Disable pooling for cloud platforms
    });
  }
};

// Email templates
const emailTemplates = {
  vendorApproved: (vendorData) => ({
    subject: '🎉 Your ChillNet Vendor Account Has Been Approved!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vendor Account Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .highlight { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
            <h2>Your Vendor Account Has Been Approved</h2>
          </div>
          
          <div class="content">
            <p>Hi <strong>${vendorData.fname}</strong>,</p>
            
            <p>Great news! Your ChillNet vendor application has been approved by our admin team.</p>
            <p><strong>Important:</strong> To start receiving payments, please complete your GCash QR code setup in your vendor dashboard under Settings → QR Code Setup. This is required before you can manage products and receive customer payments.</p>
            
            <div class="highlight">
              <h3>✅ What's Next?</h3>
              <ul>
                <li>Log in to your vendor dashboard</li>
                <li>Set up your store profile</li>
                <li>Add your delicious ice cream products</li>
                <li>Set your prices and delivery areas</li>
                <li>Start receiving orders from customers!</li>
              </ul>
            </div>
            
            <p>You can now start selling your ice cream through ChillNet and reach more customers in your area.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button text-white">Login to Dashboard</a>
            </div>
            
            <p>If you have any questions or need help getting started, feel free to contact our support team.</p>
            
            <p>Welcome to the ChillNet family!</p>
            
            <p>Best regards,<br>
            <strong>ChillNet Admin Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This email was sent from ChillNet - Your Ice Cream Ordering Platform</p>
            <p>If you didn't apply for a vendor account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,  
    text: `
      🎉 Congratulations! Your ChillNet Vendor Account Has Been Approved!
      
      Hi ${vendorData.fname},
      
      Great news! Your ChillNet vendor application has been approved by our admin team.
      
      IMPORTANT: To start receiving payments, please complete your GCash QR code setup in your vendor dashboard under Settings → QR Code Setup. This is required before you can manage products and receive customer payments.
      
      What's Next?
      ✅ Log in to your vendor dashboard
      ✅ Set up your store profile  
      ✅ Add your delicious ice cream products
      ✅ Set your prices and delivery areas
      ✅ Start receiving orders from customers!
      
      You can now start selling your ice cream through ChillNet and reach more customers in your area.
      
      Login to Dashboard: ${process.env.FRONTEND_URL}/login
      
      If you have any questions or need help getting started, feel free to contact our support team.
      
      Welcome to the ChillNet family!
      
      Best regards,
      ChillNet Admin Team
      
      ---
      This email was sent from ChillNet - Your Ice Cream Delivery Platform
      If you didn't apply for a vendor account, please ignore this email.
    `
  }),

  orderPaymentReminder: (data) => {
    const customerName = data.customerName || 'there';
    const paymentWindowMinutes = data.paymentWindowMinutes || 30;
    let deadlineDisplay = `the next ${paymentWindowMinutes} minutes`;

    if (data.paymentDeadline) {
      try {
        const deadlineDate = new Date(data.paymentDeadline);
        if (!Number.isNaN(deadlineDate.getTime())) {
          deadlineDisplay = deadlineDate.toLocaleString('en-PH', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        }
      } catch (error) {
        console.warn('⚠️ Failed to format payment deadline for email template:', error);
      }
    }

    const formattedAmount = data.totalAmount !== undefined && data.totalAmount !== null
      ? Number(data.totalAmount).toLocaleString('en-PH', {
          style: 'currency',
          currency: 'PHP'
        })
      : null;

    return {
      subject: `Complete Your Payment for Order #${data.orderId}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Payment Reminder</title>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f6fb; margin: 0; padding: 20px; color: #1f2937; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); overflow: hidden; }
              .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; padding: 28px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 28px; }
              .content p { line-height: 1.6; margin-bottom: 16px; }
              .order-summary { background-color: #f8fafc; border-radius: 10px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; }
              .order-summary h3 { margin-top: 0; color: #1d4ed8; }
              .button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 10px; }
              .footer { padding: 20px; text-align: center; font-size: 13px; color: #64748b; background: #f8fafc; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Payment Reminder</h1>
                <p>Order #${data.orderId}</p>
              </div>
              <div class="content">
                <p>Hi ${customerName},</p>
                <p>Your order with <strong>${data.vendorName || 'the vendor'}</strong> has been confirmed. Please complete your payment within <strong>${paymentWindowMinutes} minutes</strong> to avoid automatic cancellation.</p>
                <div class="order-summary">
                  <h3>Order Summary</h3>
                  <p><strong>Order ID:</strong> #${data.orderId}</p>
                  ${
                    formattedAmount
                      ? `<p><strong>${
                          data.partialPercentage
                            ? `Initial Payment (${data.partialPercentage}%)`
                            : data.isPartial
                              ? 'Amount Due Now'
                              : 'Amount Due'
                        }:</strong> ${formattedAmount}</p>`
                      : ''
                  }
                  ${
                    data.isPartial && data.remainingBalance !== undefined && data.remainingBalance !== null
                      ? `<p><strong>Remaining Balance:</strong> ${Number(data.remainingBalance).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>`
                      : ''
                  }
                  <p><strong>Payment Deadline:</strong> ${deadlineDisplay}</p>
                  ${data.paymentInstructions ? `<p>${data.paymentInstructions}</p>` : ''}
                </div>
                <p>Please visit your ChillNet account to upload your GCash payment proof and complete the transaction.</p>
                <p>If you've already completed your payment, you can ignore this reminder.</p>
                <p>Thank you for choosing ChillNet! 🍨</p>
              </div>
              <div class="footer">
                <p>This is an automated reminder from ChillNet.</p>
                <p>If you need assistance, please contact our support team.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Payment Reminder for Order #${data.orderId}

        Hi ${customerName},

        Your order with ${data.vendorName || 'the vendor'} has been confirmed. Please complete your payment within ${paymentWindowMinutes} minutes to avoid automatic cancellation.

        Order Summary:
        - Order ID: #${data.orderId}
        ${
          formattedAmount
            ? `- ${
                data.partialPercentage
                  ? `Initial Payment (${data.partialPercentage}%)`
                  : data.isPartial
                    ? 'Amount Due Now'
                    : 'Amount Due'
              }: ${formattedAmount}`
            : ''
        }
        ${
          data.isPartial && data.remainingBalance !== undefined && data.remainingBalance !== null
            ? `- Remaining Balance: ${Number(data.remainingBalance).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}`
            : ''
        }
        - Payment Deadline: ${deadlineDisplay}
        ${data.paymentInstructions ? `- ${data.paymentInstructions}` : ''}

        Complete payment: ${(process.env.FRONTEND_URL || 'http://localhost:3000')}/customer/gcash-account/${data.orderId}

        If you've already completed your payment, you can ignore this reminder.

        Thank you for choosing ChillNet! 🍨
      `
    };
  },

  subscriptionUpgraded: (subscriptionData) => ({
    subject: `🎉 Subscription Upgraded to ${subscriptionData.plan_name.charAt(0).toUpperCase() + subscriptionData.plan_name.slice(1)} Plan!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Upgraded</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .highlight { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
          .plan-features { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .plan-features ul { list-style: none; padding: 0; }
          .plan-features li { padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .plan-features li:last-child { border-bottom: none; }
          .amount { font-size: 24px; font-weight: bold; color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Subscription Upgraded!</h1>
            <h2>${subscriptionData.plan_name.charAt(0).toUpperCase() + subscriptionData.plan_name.slice(1)} Plan</h2>
          </div>
          
          <div class="content">
            <p>Hi <strong>${subscriptionData.vendor_name}</strong>,</p>
            
            <p>Congratulations! Your subscription has been successfully upgraded to the <strong>${subscriptionData.plan_name.charAt(0).toUpperCase() + subscriptionData.plan_name.slice(1)} Plan</strong>.</p>
            
            <div class="highlight">
              <h3>💳 Payment Confirmation</h3>
              <p><strong>Amount Paid:</strong> <span class="amount">₱${parseFloat(subscriptionData.amount).toLocaleString()}</span></p>
              <p><strong>Payment Method:</strong> GCash</p>
              <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Valid Until:</strong> ${subscriptionData.subscription_end_date ? new Date(subscriptionData.subscription_end_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Next month'}</p>
            </div>
            
            <div class="plan-features">
              <h3>✨ Your ${subscriptionData.plan_name.charAt(0).toUpperCase() + subscriptionData.plan_name.slice(1)} Plan Features:</h3>
              <ul>
                ${subscriptionData.plan_name === 'professional' ? `
                  <li>✅ Up to 15 Ice Cream Flavors</li>
                  <li>✅ Up to 15 Drum Stock</li>
                  <li>✅ 70 Orders per month</li>
                  <li>✅ Priority Support</li>
                  <li>✅ Featured Store Listing</li>
                ` : subscriptionData.plan_name === 'premium' ? `
                  <li>✅ Unlimited Ice Cream Flavors</li>
                  <li>✅ Unlimited Drum Stock</li>
                  <li>✅ Unlimited Orders</li>
                  <li>✅ Priority Support</li>
                  <li>✅ Featured Store Listing</li>
                  <li>✅ Advanced Analytics</li>
                  <li>✅ All Professional Features</li>
                ` : ''}
              </ul>
            </div>
            
            <p>You can now enjoy all the benefits of your new plan! Start adding more products, managing more inventory, and growing your business with ChillNet.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor" class="button text-white">Go to Dashboard</a>
            </div>
            
            <p>Thank you for choosing ChillNet to grow your ice cream business! 🍨</p>
            
            <p>Best regards,<br>
            <strong>ChillNet Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This email was sent from ChillNet - Your Ice Cream Business Platform</p>
            <p>Need help? Contact our support team at any time.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      🎉 Subscription Upgraded to ${subscriptionData.plan_name.charAt(0).toUpperCase() + subscriptionData.plan_name.slice(1)} Plan!
      
      Hi ${subscriptionData.vendor_name},
      
      Congratulations! Your subscription has been successfully upgraded to the ${subscriptionData.plan_name.charAt(0).toUpperCase() + subscriptionData.plan_name.slice(1)} Plan.
      
      💳 Payment Confirmation:
      - Amount Paid: ₱${parseFloat(subscriptionData.amount).toLocaleString()}
      - Payment Method: GCash
      - Payment Date: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
      - Valid Until: ${subscriptionData.subscription_end_date ? new Date(subscriptionData.subscription_end_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Next month'}
      
      ✨ Your ${subscriptionData.plan_name.charAt(0).toUpperCase() + subscriptionData.plan_name.slice(1)} Plan Features:
      ${subscriptionData.plan_name === 'professional' ? `
      ✅ Up to 15 Ice Cream Flavors
      ✅ Up to 15 Drum Stock
      ✅ 70 Orders per month
      ✅ Priority Support
      ✅ Featured Store Listing
      ` : subscriptionData.plan_name === 'premium' ? `
      ✅ Unlimited Ice Cream Flavors
      ✅ Unlimited Drum Stock
      ✅ Unlimited Orders
      ✅ Priority Support
      ✅ Featured Store Listing
      ✅ Advanced Analytics
      ✅ All Professional Features
      ` : ''}
      
      You can now enjoy all the benefits of your new plan! Start adding more products, managing more inventory, and growing your business with ChillNet.
      
      Go to Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor
      
      Thank you for choosing ChillNet to grow your ice cream business! 🍨
      
      Best regards,
      ChillNet Team
      
      ---
      This email was sent from ChillNet - Your Ice Cream Business Platform
      Need help? Contact our support team at any time.
    `
  }),

  vendorRejected: (vendorData) => ({
    subject: 'Update on Your ChillNet Vendor Application',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vendor Application Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .info-box { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .reapply-date { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Application Update</h1>
            <h2>Vendor Application Review</h2>
          </div>
          
          <div class="content">
            <p>Hi <strong>${vendorData.fname}</strong>,</p>
            
            <p>Thank you for your interest in becoming a ChillNet vendor.</p>
            
            <div class="info-box">
              <h3>📝 Application Status</h3>
              <p>Unfortunately, your vendor application was not approved at this time.</p>
              <p><strong>Reason:</strong> ${vendorData.rejectionReason || 'Application requires additional review and improvements.'}</p>
            </div>
            
            <div class="reapply-date">
              <h3>🔄 Reapplication</h3>
              <p>You can reapply after <strong>1 week</strong> (${vendorData.autoReturnDate}) to give you time to address any issues.</p>
              <p>This waiting period helps ensure all applications meet our quality standards.</p>
            </div>
            
            <p>We encourage you to review your application and make any necessary improvements before reapplying.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor-register" class="button text-white" style="display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reapply as Vendor</a>
            </div>
            
            <p>If you have questions about the rejection reason or need guidance on improving your application, please contact our support team.</p>
            
            <p>We appreciate your interest in ChillNet and look forward to your future application.</p>
            
            <p>Best regards,<br>
            <strong>ChillNet Admin Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This email was sent from ChillNet - Your Ice Cream Ordering Platform</p>
            <p>If you didn't apply for a vendor account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      📋 Update on Your ChillNet Vendor Application
      
      Hi ${vendorData.fname},
      
      Thank you for your interest in becoming a ChillNet vendor.
      
      Application Status:
      Unfortunately, your vendor application was not approved at this time.
      Reason: ${vendorData.rejectionReason || 'Application requires additional review and improvements.'}
      
      Reapplication:
      You can reapply after 1 week (${vendorData.autoReturnDate}) to give you time to address any issues.
      This waiting period helps ensure all applications meet our quality standards.
      
      We encourage you to review your application and make any necessary improvements before reapplying.
      
      Reapply as Vendor: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor-register
      
      If you have questions about the rejection reason or need guidance on improving your application, please contact our support team.
      
      We appreciate your interest in ChillNet and look forward to your future application.
      
      Best regards,
      ChillNet Admin Team
      
      ---
      This email was sent from ChillNet - Your Ice Cream Ordering Platform
      If you didn't apply for a vendor account, please ignore this email.
    `
  }),

  orderOutForDelivery: (orderData) => ({
    subject: `🚚 Your ChillNet Order #${orderData.orderId} is On The Way!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Out for Delivery</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .delivery-box { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .payment-reminder { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .order-details { background: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button-secondary { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .icon { font-size: 48px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🚚</div>
            <h1>Your Order is On The Way!</h1>
            <p>Order #${orderData.orderId}</p>
          </div>
          
          <div class="content">
            <p>Hi <strong>${orderData.customerName}</strong>,</p>
            
            <div class="delivery-box">
              <h2 style="margin-top: 0; color: #059669;">🍨 Great News!</h2>
              <p style="font-size: 16px; margin-bottom: 0;">Your delicious ice cream order from <strong>${orderData.vendorName}</strong> is now out for delivery and heading your way!</p>
            </div>
            
            <div class="order-details">
              <h3 style="margin-top: 0;">📦 Order Details</h3>
              <p><strong>Order ID:</strong> #${orderData.orderId}</p>
              <p><strong>Vendor:</strong> ${orderData.vendorName}</p>
              <p><strong>Delivery Address:</strong><br>${orderData.deliveryAddress}</p>
              ${orderData.estimatedTime ? `<p><strong>Estimated Arrival:</strong> ${orderData.estimatedTime}</p>` : ''}
              ${orderData.remainingBalance && parseFloat(orderData.remainingBalance) > 0 ? `
                <p><strong>Remaining Balance:</strong> ₱${parseFloat(orderData.remainingBalance).toFixed(2)}</p>
                <p><strong>Payment Method:</strong> ${orderData.remainingPaymentMethod || 'Cash on Delivery'}</p>
              ` : ''}
            </div>
            
            ${orderData.remainingBalance && parseFloat(orderData.remainingBalance) > 0 ? `
              <div class="payment-reminder">
                <h3 style="margin-top: 0; color: #d97706;">💰 Payment Reminder</h3>
                ${orderData.remainingPaymentMethod === 'GCash' ? `
                  <p style="font-size: 16px; margin-bottom: 10px;">
                    <strong>Don't forget to pay your remaining balance of ₱${parseFloat(orderData.remainingBalance).toFixed(2)} via GCash!</strong>
                  </p>
                  <p>You can complete your payment now before the delivery arrives:</p>
                  <div style="text-align: center; margin: 15px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/gcash-account/${orderData.orderId}?remaining=true" class="button-secondary" style="color: white; text-decoration: none;">
                      💳 Pay Remaining Balance via GCash
                    </a>
                  </div>
                  <p style="font-size: 14px; color: #666; margin-top: 10px;">
                    💡 Tip: Paying now ensures a faster delivery process!
                  </p>
                ` : `
                  <p style="font-size: 16px; margin-bottom: 10px;">
                    <strong>Please prepare ₱${parseFloat(orderData.remainingBalance).toFixed(2)} in cash for Cash on Delivery (COD) payment.</strong>
                  </p>
                  <p>💵 Please have the exact amount or small bills ready when the delivery arrives.</p>
                  <p style="font-size: 14px; color: #666; margin-top: 10px;">
                    💡 Having the right amount ready helps speed up the delivery process!
                  </p>
                `}
              </div>
            ` : ''}
            
            <p>🔔 <strong>Please be ready to receive your order!</strong></p>
            <p>Our delivery team will contact you if they need any assistance finding your location.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/orders" class="button" style="color: white; text-decoration: none;">Track Your Order</a>
            </div>
            
            <p>Thank you for choosing ChillNet! Enjoy your ice cream! 🍦</p>
            
            <p>Best regards,<br>
            <strong>ChillNet Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This email was sent from ChillNet - Your Ice Cream Delivery Platform</p>
            <p>Need help? Contact us through your customer dashboard.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      🚚 Your ChillNet Order #${orderData.orderId} is On The Way!
      
      Hi ${orderData.customerName},
      
      Great News!
      Your delicious ice cream order from ${orderData.vendorName} is now out for delivery and heading your way!
      
      📦 Order Details:
      - Order ID: #${orderData.orderId}
      - Vendor: ${orderData.vendorName}
      - Delivery Address: ${orderData.deliveryAddress}
      ${orderData.estimatedTime ? `- Estimated Arrival: ${orderData.estimatedTime}` : ''}
      ${orderData.remainingBalance && parseFloat(orderData.remainingBalance) > 0 ? `- Remaining Balance: ₱${parseFloat(orderData.remainingBalance).toFixed(2)}
      - Payment Method: ${orderData.remainingPaymentMethod || 'Cash on Delivery'}` : ''}
      
      ${orderData.remainingBalance && parseFloat(orderData.remainingBalance) > 0 ? `
      💰 PAYMENT REMINDER:
      ${orderData.remainingPaymentMethod === 'GCash' ? `
      Don't forget to pay your remaining balance of ₱${parseFloat(orderData.remainingBalance).toFixed(2)} via GCash!
      
      Pay now: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/gcash-account/${orderData.orderId}?remaining=true
      
      💡 Tip: Paying now ensures a faster delivery process!
      ` : `
      Please prepare ₱${parseFloat(orderData.remainingBalance).toFixed(2)} in cash for Cash on Delivery (COD) payment.
      
      💵 Please have the exact amount or small bills ready when the delivery arrives.
      💡 Having the right amount ready helps speed up the delivery process!
      `}
      ` : ''}
      
      🔔 Please be ready to receive your order!
      
      Our delivery team will contact you if they need any assistance finding your location.
      
      Track Your Order: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/orders
      
      Thank you for choosing ChillNet! Enjoy your ice cream! 🍦
      
      Best regards,
      ChillNet Team
      
      ---
      This email was sent from ChillNet - Your Ice Cream Delivery Platform
      Need help? Contact us through your customer dashboard.
    `
  })
};

// Send email function
const sendEmail = async (to, templateName, data) => {
  try {
    // Check if email notifications are enabled
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
      console.log('📧 Email notifications disabled, skipping email send');
      return { success: true, message: 'Email notifications disabled' };
    }

    // Auto-detect environment: Gmail for localhost, Resend for production
    const service = process.env.NODE_ENV === 'production' 
      ? (process.env.EMAIL_SERVICE || 'resend')
      : (process.env.EMAIL_SERVICE || 'gmail');
    
    console.log(`📧 Using email service: ${service} (NODE_ENV: ${process.env.NODE_ENV})`);
    
    if (service === 'resend') {
      if (!process.env.RESEND_API_KEY) {
        console.error('❌ Resend configuration missing. Please set RESEND_API_KEY');
        return { success: false, error: 'Resend configuration missing' };
      }
    } else if (service === 'mailgun') {
      if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
        console.error('❌ Mailgun configuration missing. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN');
        return { success: false, error: 'Mailgun configuration missing' };
      }
    } else {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('❌ Gmail configuration missing. Please set EMAIL_USER and EMAIL_PASSWORD');
        return { success: false, error: 'Gmail configuration missing' };
      }
    }

    console.log(`📧 Sending ${templateName} email to: ${to}`);

    const transporter = createTransporter();
    const template = emailTemplates[templateName];
    
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const emailContent = template(data);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `ChillNet Admin <${process.env.EMAIL_USER}>`,
      to: to,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    };

    console.log('📧 Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}:`, result);
    return { 
      success: true, 
      messageId: result.id || result.messageId,
      message: 'Email sent successfully',
      details: result
    };

  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return { 
      success: false, 
      error: error.message,
      message: 'Failed to send email' 
    };
  }
};

// Specific functions for vendor notifications
const sendVendorApprovalEmail = async (vendorData) => {
  return await sendEmail(vendorData.email, 'vendorApproved', vendorData);
};

const sendVendorRejectionEmail = async (vendorData) => {
  return await sendEmail(vendorData.email, 'vendorRejected', vendorData);
};

const sendSubscriptionUpgradeEmail = async (subscriptionData) => {
  return await sendEmail(subscriptionData.vendor_email, 'subscriptionUpgraded', subscriptionData);
};

const sendOrderDeliveryEmail = async (orderData) => {
  return await sendEmail(orderData.customerEmail, 'orderOutForDelivery', orderData);
};

module.exports = {
  sendEmail,
  sendVendorApprovalEmail,
  sendVendorRejectionEmail,
  sendSubscriptionUpgradeEmail,
  sendOrderDeliveryEmail,
  emailTemplates
};
