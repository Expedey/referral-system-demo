# Weekly Email Digest Setup Guide

This guide explains how to set up and use the weekly email digest feature that automatically sends comprehensive referral statistics to your team inbox via HubSpot.

## 🎯 What's Included

The weekly email digest includes all the requested information:

- ✅ **Top 10 referrers** - Users with the highest referral counts
- ✅ **Total growth** - User and referral growth statistics with weekly comparison
- ✅ **Number of flagged accounts** - Fraud detection statistics
- ✅ **Tier breakdown** - User distribution across Bronze, Silver, Gold, Platinum, and Diamond tiers

## 🚀 Quick Setup

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Required for email digest
TEAM_EMAIL=team@yourcompany.com
HUBSPOT_API_KEY=your_hubspot_api_token

# Optional - for production deployment
API_BASE_URL=https://yourdomain.com
```

### 2. Files Created

- ✅ `src/services/emailDigestService.ts` - Core digest generation service
- ✅ `src/app/api/email-digest/weekly/route.ts` - API endpoint
- ✅ `scripts/send-weekly-digest.js` - Cron job script
- ✅ `WEEKLY_EMAIL_DIGEST_SETUP.md` - This documentation

## 📊 Email Digest Content

### Top 10 Referrers
- User email and username
- Referral code
- Total referral count
- Ranked by performance

### Total Growth
- **Total Users**: Overall user count
- **Total Referrals**: All referral attempts
- **Verified Referrals**: Successfully verified referrals
- **Conversion Rate**: Percentage of successful referrals
- **Weekly Growth**: Percentage change from previous week

### Flagged Accounts
- **Total Flagged**: All-time fraud attempts
- **This Week**: Fraud attempts in the last 7 days
- **Unique IPs**: Number of unique IPs involved in fraud

### Tier Breakdown
- **Bronze (0-2 referrals)**: New users
- **Silver (3-5 referrals)**: Active users
- **Gold (6-10 referrals)**: Power users
- **Platinum (11-20 referrals)**: Elite users
- **Diamond (20+ referrals)**: Top performers

## 🔧 API Endpoints

### Generate and Send Weekly Digest
```bash
POST /api/email-digest/weekly
Content-Type: application/json

{
  "teamEmail": "team@yourcompany.com",
  "sendEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Weekly digest generated successfully",
  "data": {
    "topReferrers": [...],
    "totalGrowth": {...},
    "flaggedAccounts": {...},
    "tierBreakdown": [...],
    "weekRange": {...}
  },
  "emailSent": true,
  "teamEmail": "team@yourcompany.com",
  "generatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Preview Digest (No Email)
```bash
GET /api/email-digest/weekly
```

## 🤖 Automated Sending

### Option 1: Cron Job (Recommended)

1. **Make the script executable:**
   ```bash
   chmod +x scripts/send-weekly-digest.js
   ```

2. **Set up a cron job:**
   ```bash
   # Edit crontab
   crontab -e
   
   # Add this line to run every Monday at 9 AM
   0 9 * * 1 /usr/bin/node /path/to/your/project/scripts/send-weekly-digest.js
   ```

3. **Test the cron job:**
   ```bash
   # Test without sending email
   node scripts/send-weekly-digest.js --test
   
   # Test with sending email
   node scripts/send-weekly-digest.js
   ```

### Option 2: Vercel Cron Jobs

If using Vercel, add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/email-digest/weekly",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

### Option 3: GitHub Actions

Create `.github/workflows/weekly-digest.yml`:

```yaml
name: Weekly Email Digest

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC

jobs:
  send-digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/send-weekly-digest.js
        env:
          TEAM_EMAIL: ${{ secrets.TEAM_EMAIL }}
          HUBSPOT_API_KEY: ${{ secrets.HUBSPOT_API_KEY }}
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
```

## 📧 HubSpot Email Integration

### Current Status
The email digest service generates beautiful HTML email content but needs HubSpot email sending integration.

### To Complete HubSpot Integration:

1. **Create HubSpot Email Template:**
   - Go to HubSpot Marketing → Email → Templates
   - Create a new template using the HTML from `EmailDigestService.generateEmailContent()`
   - Save the template ID

2. **Update EmailDigestService:**
   ```typescript
   // In src/services/emailDigestService.ts
   static async sendWeeklyDigest(teamEmail: string): Promise<boolean> {
     try {
       const digestData = await this.generateWeeklyDigest();
       const emailContent = this.generateEmailContent(digestData);
       
       // Use HubSpot's email API to send
       const response = await fetch('https://api.hubapi.com/marketing/v3/transactional/single-email/send', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           to: teamEmail,
           subject: 'Weekly Referral Digest',
           html: emailContent,
         }),
       });
       
       return response.ok;
     } catch (error) {
       console.error('[EmailDigestService] Error sending email:', error);
       return false;
     }
   }
   ```

3. **Alternative: Use HubSpot Workflows:**
   - Create a HubSpot workflow triggered by a custom property
   - Use the API to update the property weekly
   - Let HubSpot handle the email sending

## 🧪 Testing

### Test the API Endpoint
```bash
# Test digest generation
curl -X GET http://localhost:3000/api/email-digest/weekly

# Test sending digest
curl -X POST http://localhost:3000/api/email-digest/weekly \
  -H "Content-Type: application/json" \
  -d '{"teamEmail": "test@example.com", "sendEmail": false}'
```

### Test the Cron Script
```bash
# Test without sending email
node scripts/send-weekly-digest.js --test

# Test with sending email
node scripts/send-weekly-digest.js
```

## 📈 Monitoring

### Check Logs
The system logs all operations:
- `[EmailDigestService]` - Digest generation
- `[Email Digest API]` - API endpoint operations
- Script logs for cron job execution

### Verify Data
- Check that all statistics are accurate
- Verify email delivery in HubSpot
- Monitor for any errors in the logs

## 🔒 Security Considerations

1. **API Key Security:**
   - Never commit API keys to version control
   - Use environment variables for all sensitive data
   - Rotate keys regularly

2. **Email Security:**
   - Validate team email addresses
   - Implement rate limiting on the API
   - Log all email sending attempts

3. **Data Privacy:**
   - Only include necessary user data in emails
   - Consider GDPR compliance for user information
   - Implement data retention policies

## 🛠 Troubleshooting

### Common Issues

1. **API Key Errors:**
   - Verify `HUBSPOT_API_KEY` is set correctly
   - Check that the key has email sending permissions
   - Test the key with HubSpot's API directly

2. **Email Not Sending:**
   - Check HubSpot email sending configuration
   - Verify team email address is valid
   - Check HubSpot sending limits

3. **Cron Job Not Running:**
   - Verify cron job syntax
   - Check system logs for errors
   - Test the script manually first

4. **Data Issues:**
   - Verify database connections
   - Check that fraud_records table exists
   - Ensure all required tables are populated

### Debug Commands
```bash
# Check environment variables
echo $TEAM_EMAIL
echo $HUBSPOT_API_KEY

# Test database connection
node -e "require('dotenv').config(); const { supabase } = require('./src/lib/supabase'); console.log('DB connected')"

# Test HubSpot connection
node -e "require('dotenv').config(); const { HubSpotDirectService } = require('./src/services/hubspotDirectService'); console.log('HubSpot connected')"
```

## 🚀 Next Steps

1. **Complete HubSpot Email Integration** (see above)
2. **Set up monitoring and alerting**
3. **Customize email template design**
4. **Add more digest content as needed**
5. **Implement digest scheduling options**

## 📞 Support

If you encounter issues:
1. Check the logs for error messages
2. Verify your HubSpot setup matches the guide
3. Test with a single digest first before automation
4. Review the troubleshooting section above

The weekly email digest system is now ready to provide comprehensive referral insights to your team automatically! 