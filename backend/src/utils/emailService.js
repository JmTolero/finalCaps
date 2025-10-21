const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  const service = process.env.EMAIL_SERVICE || 'gmail';
  
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
  } else if (service === 'mailgun') {
    return nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
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

    // Validate required environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('❌ Email configuration missing. Please set EMAIL_USER and EMAIL_PASSWORD');
      return { success: false, error: 'Email configuration missing' };
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

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}:`, result.messageId);
    return { 
      success: true, 
      messageId: result.messageId,
      message: 'Email sent successfully' 
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
