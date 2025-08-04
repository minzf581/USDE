const nodemailer = require('nodemailer');

// Create transporter (for production, use real SMTP settings)
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // For development, use ethereal email
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'test123'
      }
    });
  }
};

// Send verification email
const sendVerificationEmail = async (email, companyName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: '"USDE Platform" <noreply@usde.com>',
      to: email,
      subject: 'Welcome to USDE Enterprise Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0D43F9;">Welcome to USDE Enterprise Platform</h2>
          <p>Dear ${companyName},</p>
          <p>Thank you for registering with the USDE Enterprise Platform. Your account has been created successfully.</p>
          <p>To complete your registration, please complete the KYC process by uploading the required documents.</p>
          <div style="background-color: #F2F5F9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #292929; margin-top: 0;">Next Steps:</h3>
            <ul>
              <li>Complete your KYC verification</li>
              <li>Upload required business documents</li>
              <li>Wait for approval (usually 1-2 business days)</li>
              <li>Start using USDE for your business needs</li>
            </ul>
          </div>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The USDE Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Send KYC status update email
const sendKYCStatusEmail = async (email, companyName, status) => {
  try {
    const transporter = createTransporter();
    
    const statusMessages = {
      approved: {
        subject: 'KYC Approved - Welcome to USDE Platform',
        message: 'Your KYC verification has been approved! You can now start using all features of the USDE platform.'
      },
      rejected: {
        subject: 'KYC Review Required',
        message: 'Your KYC verification requires additional information. Please review and resubmit your documents.'
      }
    };

    const statusInfo = statusMessages[status] || {
      subject: 'KYC Status Update',
      message: 'Your KYC status has been updated.'
    };

    const mailOptions = {
      from: '"USDE Platform" <noreply@usde.com>',
      to: email,
      subject: statusInfo.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0D43F9;">KYC Status Update</h2>
          <p>Dear ${companyName},</p>
          <p>${statusInfo.message}</p>
          <div style="background-color: #F2F5F9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #292929; margin-top: 0;">Status: ${status.toUpperCase()}</h3>
            <p>You can log in to your account to view the full details.</p>
          </div>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The USDE Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('KYC status email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendKYCStatusEmail
}; 