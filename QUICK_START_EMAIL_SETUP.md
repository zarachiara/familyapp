# Quick Start: Email Notification Setup

## ✅ What's Already Done

The email notification system is **fully integrated** with the UI! Here's what's working:

- ✅ Frontend Settings page with toggle switches
- ✅ Backend API endpoints for preferences and test emails
- ✅ Email service with Brevo integration
- ✅ Professional HTML email templates
- ✅ CORS configured for all frontend ports
- ✅ Authentication with token management

## 🚀 Quick Setup (2 Steps)

### Step 1: Get Your Brevo API Key

1. **Sign up for Brevo** (free account):
   - Go to https://www.brevo.com/
   - Click "Sign up free"
   - Complete registration

2. **Get your API key**:
   - Log in to Brevo dashboard
   - Go to **Settings** → **API Keys** (or visit https://app.brevo.com/settings/keys/api)
   - Click **"Create a new API key"**
   - Give it a name like "FairShare Development"
   - **Copy the API key** (you'll only see it once!)

### Step 2: Add API Key to Backend

1. **Open the backend .env file**:
   ```bash
   # The file is located at: backend/.env
   ```

2. **Find this line**:
   ```env
   BREVO_API_KEY=
   ```

3. **Paste your API key**:
   ```env
   BREVO_API_KEY=xkeysib-your-actual-api-key-here
   ```

4. **Save the file** - The backend will auto-reload!

## 🎯 Test It Now!

1. **Open the app**: http://localhost:5138

2. **Log in** with any email (e.g., `test@example.com`)

3. **Go to Settings** page

4. **You'll see**:
   - Your email address displayed
   - 5 toggle switches for notification preferences
   - A "Send Test Email" button

5. **Click "Send Test Email"**:
   - You should see a success message
   - Check your email inbox (the one you logged in with)
   - The test email should arrive within seconds!

6. **Toggle preferences**:
   - Each toggle saves automatically
   - You'll see success notifications

## 📧 Where to Get the Brevo API Key

**Direct Link**: https://app.brevo.com/settings/keys/api

**Step-by-step**:
1. Log in to Brevo
2. Click your profile icon (top right)
3. Select "SMTP & API"
4. Click "API Keys" tab
5. Click "Create a new API key"
6. Copy the key

## ⚠️ Important Notes

### Free Tier Limits
- **300 emails per day** (plenty for testing!)
- No credit card required
- Perfect for development

### Email Delivery
- Test emails arrive in **seconds**
- Check spam folder if not in inbox
- Use a real email address when logging in

### Troubleshooting

**"Failed to send test email"**
- ✅ Check: Did you add the API key to `.env`?
- ✅ Check: Did you save the `.env` file?
- ✅ Check: Is the backend running? (should auto-reload)
- ✅ Check: Look at backend terminal for error messages

**"Failed to update preferences"**
- ✅ Check: Are you logged in?
- ✅ Check: Is backend running on port 8000?
- ✅ Check: Open browser console (F12) for errors

**CORS Errors**
- ✅ Already fixed! The `.env` now includes all ports:
  ```env
  CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:5138
  ```

## 🎨 What You Can Do

### Toggle Notifications
- **Daily Task Reminders**: Get daily task summaries
- **Weekly Fairness Summary**: Weekly household fairness reports
- **Task Due Reminders**: Alerts when tasks are due soon
- **Overdue Task Follow-ups**: Notifications for overdue tasks
- **FairFlow Updates**: Alerts when task rebalancing occurs

### Send Test Emails
- Verify your email configuration
- See what the emails look like
- Test delivery speed

### View Your Email
- The Settings page shows which email will receive notifications
- This is the email you used to log in

## 📝 Example .env Configuration

Your `backend/.env` should look like this:

```env
# Application Environment
APP_ENV=development
PORT=8000

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/familyflow

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=604800

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:5138

# Email Configuration (Brevo)
BREVO_API_KEY=xkeysib-your-actual-api-key-paste-here
SENDER_EMAIL=noreply@fairshare.app
SENDER_NAME=FairShare
```

## 🔗 Useful Links

- **Brevo Dashboard**: https://app.brevo.com/
- **Brevo API Keys**: https://app.brevo.com/settings/keys/api
- **Brevo Documentation**: https://developers.brevo.com/
- **Free Signup**: https://www.brevo.com/

## ✨ That's It!

Once you add your Brevo API key, everything works! The UI is already connected and ready to use.

**Need help?** Check the backend terminal for detailed error messages.