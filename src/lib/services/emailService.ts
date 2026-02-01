import nodemailer from 'nodemailer';

let transporter: any | null = null;
let transporterKey: string | null = null;

type EmailConfig = any;

function getAuthConfig() {
  return {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
  };
}

// Build email service configuration (supports Gmail service shortcut)
function buildEmailConfig(): EmailConfig {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true'; // true for 465, false for other ports
  const auth = getAuthConfig();

  if (host.includes('gmail.com')) {
    return {
      service: 'gmail',
      auth,
    };
  }

  return {
    host,
    port,
    secure,
    auth,
  };
}

// Initialize transporter (rebuild if credentials/config change)
function getTransporter() {
  const auth = getAuthConfig();
  if (!auth.user || !auth.pass) {
    return null;
  }

  const config = buildEmailConfig();
  const key = JSON.stringify({
    host: (config as any).host ?? (config as any).service,
    port: (config as any).port,
    secure: (config as any).secure,
    user: auth.user,
  });

  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport(config);
    transporterKey = key;
  }

  return transporter;
}

// Email template for OTP
function getOTPEmailTemplate(recipientName: string, otp: string, expiryMinutes: number = 10) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 40px;
            text-align: center;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
          }
          .otp-box {
            background-color: #f9f9f9;
            border: 2px solid #667eea;
            border-radius: 8px;
            padding: 30px;
            margin: 30px 0;
          }
          .otp-label {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }
          .otp-code {
            font-size: 48px;
            font-weight: 700;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Monaco', 'Courier New', monospace;
            margin: 0;
          }
          .expiry {
            font-size: 14px;
            color: #ff6b6b;
            margin-top: 20px;
            font-weight: 500;
          }
          .instructions {
            background-color: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
            text-align: left;
            font-size: 14px;
          }
          .instructions li {
            margin-bottom: 10px;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
          }
          .security-note {
            font-size: 12px;
            color: #666;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SparesX</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Password Reset Request</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Hi ${recipientName},
            </div>
            
            <p style="margin: 0 0 20px 0; color: #666;">
              We received a request to reset your password. Use the code below to verify your identity.
            </p>
            
            <div class="otp-box">
              <div class="otp-label">Your Verification Code</div>
              <div class="otp-code">${otp}</div>
              <div class="expiry">⏱️ Valid for ${expiryMinutes} minutes</div>
            </div>
            
            <div class="instructions">
              <strong style="display: block; margin-bottom: 10px;">How to proceed:</strong>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Return to the password reset page</li>
                <li>Enter the 6-digit code above</li>
                <li>Create your new password</li>
                <li>Save and login with your new password</li>
              </ol>
            </div>
            
            <div class="security-note">
              <strong>🔒 Security Notice:</strong> Never share this code with anyone. SparesX staff will never ask for this code.
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">© 2026 SparesX. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

interface SendOTPEmailParams {
  recipientEmail: string;
  recipientName: string;
  otp: string;
  expiryMinutes?: number;
}

/**
 * Send OTP email to user
 */
export async function sendOTPEmail({
  recipientEmail,
  recipientName,
  otp,
  expiryMinutes = 10,
}: SendOTPEmailParams): Promise<boolean> {
  try {
    const transporter = getTransporter();

    // If transporter is not available, log and return false
    if (!transporter) {
      console.warn('Email service not configured. OTP:', otp);
      console.warn('Email would be sent to:', recipientEmail);
      return false;
    }

    const auth = getAuthConfig();
    const mailOptions = {
      from: `SparesX <${auth.user}>`,
      to: recipientEmail,
      subject: 'Password Reset Verification Code - SparesX',
      html: getOTPEmailTemplate(recipientName, otp, expiryMinutes),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    // Log OTP for development fallback
    console.warn('OTP (fallback logging):', otp);
    return false;
  }
}

function getPasswordResetSuccessTemplate(recipientName: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 40px;
            text-align: center;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 12px;
            color: #333;
          }
          .status {
            background-color: #ecfdf5;
            border: 1px solid #d1fae5;
            border-radius: 8px;
            padding: 16px 20px;
            margin: 20px 0;
            color: #065f46;
            font-weight: 600;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
          }
          .security-note {
            font-size: 13px;
            color: #555;
            margin-top: 16px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SparesX</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Password Reset Successful</p>
          </div>
          <div class="content">
            <div class="greeting">Hi ${recipientName},</div>
            <p style="margin: 0 0 10px 0; color: #666;">Your password has been updated successfully.</p>
            <div class="status">✅ Password reset complete</div>
            <div class="security-note">
              If you did not perform this action, please contact support immediately and reset your password again.
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0;">© 2026 SparesX. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

interface PasswordResetSuccessParams {
  recipientEmail: string;
  recipientName: string;
}

export async function sendPasswordResetSuccessEmail({
  recipientEmail,
  recipientName,
}: PasswordResetSuccessParams): Promise<boolean> {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn('Email service not configured. Password reset success email not sent.');
      return false;
    }

    const auth = getAuthConfig();
    const mailOptions = {
      from: `SparesX <${auth.user}>`,
      to: recipientEmail,
      subject: 'Your SparesX password was reset',
      html: getPasswordResetSuccessTemplate(recipientName),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset success email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset success email:', error);
    return false;
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log('Email service not configured (missing SMTP credentials)');
      return false;
    }

    await transporter.verify();
    console.log('Email service verified successfully');
    return true;
  } catch (error) {
    console.error('Email service verification failed:', error);
    return false;
  }
}
