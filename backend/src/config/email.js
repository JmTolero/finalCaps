const nodemailer = require('nodemailer');

// Create email transporter with production-ready configuration
const createTransporter = () => {
    // Auto-detect environment: Gmail for localhost, Resend for production
    const service = process.env.NODE_ENV === 'production' 
        ? (process.env.EMAIL_SERVICE || 'resend')
        : (process.env.EMAIL_SERVICE || 'gmail');
    
    console.log(`📧 Password reset using email service: ${service} (NODE_ENV: ${process.env.NODE_ENV})`);
    
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
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is required when using Resend service');
        }
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
                const result = await resend.emails.send(data);
                // Resend returns { id: '...' }, convert to nodemailer format
                return { messageId: result.id || result.data?.id };
            }
        };
    } else {
        // Gmail with port 465 (SSL) - works better on cloud platforms
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error('EMAIL_USER and EMAIL_PASSWORD are required when using Gmail service');
        }
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
    passwordReset: (resetLink, userName = 'User') => ({
        subject: 'Password Reset Request - ChillNet Ice Cream',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🍦 ChillNet Ice Cream</h1>
                    <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                    <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
                    
                    <p style="color: #666; line-height: 1.6; font-size: 16px;">
                        We received a request to reset your password for your ChillNet Ice Cream account.           
                        If you made this request, click the button below to reset your password:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 25px; 
                                  font-weight: bold; 
                                  font-size: 16px;
                                  display: inline-block;">
                            Reset My Password
                        </a>
                    </div>
                    
                    <p style="color: #666; line-height: 1.6; font-size: 14px;">
                        If the button doesn't work, you can copy and paste this link into your browser:
                    </p>
                    <p style="color: #667eea; word-break: break-all; font-size: 14px; background: #f1f3f4; padding: 10px; border-radius: 5px;">
                        ${resetLink}
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                        <p style="color: #999; font-size: 12px; margin: 0;">
                            <strong>Important:</strong> This link will expire in 1 hour for security reasons. 
                            If you didn't request this password reset, please ignore this email.
                        </p>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2024 ChillNet Ice Cream. All rights reserved.</p>
                </div>
            </div>
        `,
        text: `
            Password Reset Request - ChillNet Ice Cream
            
            Hello ${userName}!
            
            We received a request to reset your password for your ChillNet Ice Cream account. 
            If you made this request, click the link below to reset your password:
            
            ${resetLink}
            
            This link will expire in 1 hour for security reasons. 
            If you didn't request this password reset, please ignore this email.
            
            © 2024 ChillNet Ice Cream. All rights reserved.
        `
    })
};

// Send email function
const sendEmail = async (to, template, data) => {
    try {
        // Check if email notifications are enabled
        if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'false') {
            console.log('📧 Email notifications disabled, skipping password reset email');
            return { success: true, message: 'Email notifications disabled' };
        }

        const transporter = createTransporter();
        const emailContent = emailTemplates[template](...data);
        
        // Determine sender email based on service
        const service = process.env.NODE_ENV === 'production' 
            ? (process.env.EMAIL_SERVICE || 'resend')
            : (process.env.EMAIL_SERVICE || 'gmail');
        
        let fromEmail;
        if (service === 'resend') {
            // Resend requires verified domain or uses onboarding@resend.dev
            fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM || 'onboarding@resend.dev';
        } else if (service === 'sendgrid') {
            fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@chillnet.com';
        } else {
            fromEmail = process.env.EMAIL_FROM || `"ChillNet Ice Cream" <${process.env.EMAIL_USER}>`;
        }
        
        const mailOptions = {
            from: fromEmail,
            to: to,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
        };

        console.log('📧 Sending password reset email:', {
            to: to,
            from: fromEmail,
            service: service
        });

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent successfully:', result.messageId || result.id);
        return { success: true, messageId: result.messageId || result.id };
    } catch (error) {
        console.error('❌ Error sending password reset email:', error.message);
        console.error('Full error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    createTransporter,
    emailTemplates,
    sendEmail
};
