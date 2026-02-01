# Email Configuration Guide for SparesX

## Overview

SparesX now supports email-based OTP (One-Time Password) delivery for password reset flows. This guide explains how to configure email sending for your environment.

## Quick Start

### 1. Install Dependencies

Email support requires `nodemailer`:

```bash
npm install nodemailer
```

This is already included in the project.

### 2. Configure SMTP Credentials

Edit your `.env.local` file and add the following variables:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

### 3. Get SMTP Credentials by Provider

#### **Gmail** (Recommended for Development)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer"
5. Google will generate a 16-character app-specific password
6. Use this password in `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Remove spaces
```

#### **Outlook/Office365**

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### **SendGrid**

1. Create account at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Use `apikey` as username and the API key as password:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### **AWS SES (Simple Email Service)**

1. Create SMTP credentials in AWS SES Console
2. Verify your sender email address

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

## How It Works

### Email Service Architecture

The email service is located at: `src/lib/services/emailService.ts`

**Key Features:**

- Automatic transporter initialization
- Beautiful HTML email templates
- Graceful fallback to console logging if email not configured
- Support for multiple SMTP providers
- Async email sending with error handling

### OTP Flow

1. **User requests password reset** → `/forgot-password`
2. **User enters email** → `POST /api/auth/forgot-password/request`
3. **Backend generates OTP** → Saves SHA-256 hash to database
4. **Email is sent** → Uses `sendOTPEmail()` function
5. **User enters OTP** → `POST /api/auth/forgot-password/verify`
6. **Password reset confirmed** → `POST /api/auth/forgot-password/reset`

### Email Template

OTP emails include:

- ✅ Attractive gradient header with branding
- ✅ Clear 6-digit OTP display
- ✅ Expiration timer (10 minutes for user reset, 24 hours for admin reset)
- ✅ Security instructions
- ✅ Security warning about code sharing
- ✅ Fallback mobile-responsive design

## Testing

### Development Environment

If SMTP credentials are not configured:

- ✅ OTP is still generated and stored in database
- ✅ OTP is logged to console for testing
- ✅ Password reset flow works normally
- ⚠️ Email is not actually sent (but shows console message)

Example console output:

```
[PASSWORD RESET] OTP sent to user@example.com
Email service not configured. OTP: 123456
```

### Test Email Sending

In development, you can manually test with:

```javascript
// In your Next.js route handler
const { sendOTPEmail } = require("@/lib/services/emailService");

await sendOTPEmail({
  recipientEmail: "test@example.com",
  recipientName: "John Doe",
  otp: "123456",
  expiryMinutes: 10,
});
```

## Endpoints That Send Email

### 1. Password Reset Request

**Route:** `POST /api/auth/forgot-password/request`

**Sends OTP to:** User's email address
**Expiry:** 10 minutes

Request body:

```json
{
  "email": "user@example.com"
}
```

Response (success):

```json
{
  "message": "OTP sent to email. Please check your inbox and spam folder.",
  "success": true
}
```

### 2. Admin Password Reset

**Route:** `POST /api/admin/users/{id}/reset-password`

**Sends OTP to:** Target user's email address
**Expiry:** 24 hours
**Authorization:** Admin token required

Response (success):

```json
{
  "message": "Password reset OTP sent to user email",
  "_dev_otp": "123456" // Only in development
}
```

## Production Deployment

### Pre-Deployment Checklist

- ✅ Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in environment variables
- ✅ Use strong SMTP credentials (not personal password)
- ✅ Enable SMTP in your email provider
- ✅ Verify sender email address with provider
- ✅ Test email delivery before going live
- ✅ Monitor email logs for delivery issues
- ⚠️ Remove `_dev_otp` from admin reset endpoint response

### Environment Setup

**On Vercel:**

1. Go to Project Settings → Environment Variables
2. Add all SMTP\_\* variables
3. Ensure they're available in both Production and Preview environments

**On Self-Hosted:**

```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_SECURE=false
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=your-app-password
```

### Troubleshooting

**Issue:** Email not sending

- Check SMTP credentials are correct
- Verify email account allows SMTP access
- Check firewall allows SMTP port (usually 587 or 465)
- Check email provider limits (e.g., SendGrid free tier limits)
- Look at server logs for error messages

**Issue:** OTP expires immediately

- Verify server time is correct
- Check database timezone settings

**Issue:** Email template not rendering

- Clear browser cache
- Check email client supports HTML (most do)
- Test with different email providers

## Security Considerations

✅ **Best Practices Implemented:**

- OTP hashed with SHA-256 before storage
- No plaintext OTPs in database
- OTPs stored with expiration timestamps
- OTPs cleared after successful password reset
- Admin OTPs have longer validity (24h) than user OTPs (10m)
- Rate limiting should be added (future work)

⚠️ **Future Improvements:**

- Implement rate limiting on OTP generation (prevent brute force)
- Add email verification flow for new accounts
- Send login notification emails
- Support email templating system
- Add unsubscribe links for regulatory compliance

## Support

For issues with email configuration:

1. Check the logs in terminal/server output
2. Verify SMTP credentials are correct
3. Test SMTP connection using a tool like `telnet`
4. Check email provider documentation
5. Review firewall/network settings

---

**Last Updated:** January 2026
**Version:** 1.0
