const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  

    
    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can change this to other services
        auth: {
            user: process.env.EMAIL_USER, // Your email
            pass: process.env.EMAIL_PASSWORD // Your app password (not regular password)
        }
    });

    return transporter;
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
        const transporter = createTransporter();
        const emailContent = emailTemplates[template](...data);
        
        const mailOptions = {
            from: `"ChillNet Ice Cream" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    createTransporter,
    emailTemplates,
    sendEmail
};
