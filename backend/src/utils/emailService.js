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
              <a href="${process.env.FRONTEND_URL}/vendor-register" class="button text-white">Reapply as Vendor</a>
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
      
      Reapply as Vendor: ${process.env.FRONTEND_URL}/vendor-register
      
      If you have questions about the rejection reason or need guidance on improving your application, please contact our support team.
      
      We appreciate your interest in ChillNet and look forward to your future application.
      
      Best regards,
      ChillNet Admin Team
      
      ---
      This email was sent from ChillNet - Your Ice Cream Ordering Platform
      If you didn't apply for a vendor account, please ignore this email.
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

module.exports = {
  sendEmail,
  sendVendorApprovalEmail,
  sendVendorRejectionEmail,
  emailTemplates
};
