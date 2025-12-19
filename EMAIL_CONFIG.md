# Email Configuration Guide

## Email Credentials

The following email credentials have been configured for the OptyShop application:

- **Email**: `Pieroporchia07@gmail.com`
- **App Password**: `rqpr awof apgw rned`

## Where to Configure

### Backend Configuration

These credentials should be configured in your **backend** application (not the frontend). The backend will use these credentials to send emails via SMTP.

#### For Node.js/Express Backend

Create or update your `.env` file in the backend directory:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=Pieroporchia07@gmail.com
SMTP_PASSWORD=rqpr awof apgw rned
SMTP_FROM=Pieroporchia07@gmail.com
SMTP_FROM_NAME=OptyShop
```

#### Example Backend Email Service (Node.js with Nodemailer)

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'Pieroporchia07@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'rqpr awof apgw rned',
  },
});

// Send email function
async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'OptyShop'}" <${process.env.SMTP_FROM || 'Pieroporchia07@gmail.com'}>`,
      to: to,
      subject: subject,
      html: html,
    });
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}
```

#### For Python/Flask Backend

```python
import os
from flask_mail import Mail, Message

app.config['MAIL_SERVER'] = os.getenv('SMTP_HOST', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('SMTP_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('SMTP_USER', 'Pieroporchia07@gmail.com')
app.config['MAIL_PASSWORD'] = os.getenv('SMTP_PASSWORD', 'rqpr awof apgw rned')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('SMTP_FROM', 'Pieroporchia07@gmail.com')

mail = Mail(app)

def send_email(to, subject, html):
    msg = Message(subject, recipients=[to], html=html)
    mail.send(msg)
```

## Email Use Cases in OptyShop

The email service is used for:

1. **Order Confirmations** - Sent when a customer completes a purchase
2. **Shipping Notifications** - Updates on order shipping status
3. **Password Reset** - When users request password reset
4. **Account Verification** - Email verification for new accounts
5. **Contact Form Submissions** - Confirmation emails
6. **Newsletter Subscriptions** - Subscription confirmations
7. **Abandoned Cart Reminders** - Reminder emails for incomplete purchases

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit credentials to version control**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for documentation (without real credentials)

2. **Use App Passwords for Gmail**
   - The provided password is a Gmail App Password
   - Regular Gmail passwords won't work with SMTP
   - To generate a new app password:
     - Go to Google Account → Security
     - Enable 2-Step Verification
     - Generate App Password for "Mail"

3. **Production Environment**
   - Use environment variables, not hardcoded values
   - Consider using a dedicated email service (SendGrid, Mailgun, AWS SES) for production
   - Rotate passwords regularly

4. **Rate Limiting**
   - Gmail has sending limits (500 emails/day for free accounts)
   - Consider using a dedicated email service for high-volume sending

## Testing Email Configuration

You can test the email configuration by:

1. **Backend Health Check** - Add an email test endpoint
2. **Send Test Email** - Create a test route that sends a sample email
3. **Check Logs** - Monitor backend logs for email sending errors

## Troubleshooting

### Common Issues

1. **"Invalid login credentials"**
   - Verify the app password is correct
   - Ensure 2-Step Verification is enabled on the Gmail account

2. **"Connection timeout"**
   - Check firewall settings
   - Verify SMTP port (587 for TLS, 465 for SSL)

3. **"Authentication failed"**
   - Make sure you're using an App Password, not the regular password
   - Check if "Less secure app access" is enabled (older Gmail accounts)

4. **"Rate limit exceeded"**
   - Gmail has daily sending limits
   - Consider using a dedicated email service for production

## Next Steps

1. ✅ Credentials provided: `Pieroporchia07@gmail.com` / `rqpr awof apgw rned`
2. ⏳ Configure in backend `.env` file
3. ⏳ Test email sending functionality
4. ⏳ Implement email templates for different use cases
5. ⏳ Set up email logging and monitoring

