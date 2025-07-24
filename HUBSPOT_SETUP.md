# HubSpot Integration Setup Guide

## Overview
This guide will help you set up HubSpot integration for your referral system to track users and referrals in your CRM.

## Prerequisites
- HubSpot account with API access
- Private app created in HubSpot
- API token with appropriate permissions

## Step 1: HubSpot Private App Setup

1. **Create a Private App in HubSpot:**
   - Go to HubSpot Settings → Integrations → Private Apps
   - Click "Create private app"
   - Give it a name (e.g., "Referral System Integration")
   - Select the following scopes:
     - `crm.objects.contacts.read`
     - `crm.objects.contacts.write`
     - `crm.objects.notes.read`
     - `crm.objects.notes.write`
     - `crm.schemas.contacts.read`

2. **Generate API Token:**
   - After creating the app, copy the API token
   - Keep this token secure - you'll need it for the environment variable

## Step 2: HubSpot Contact Properties

Create the following custom properties in HubSpot:

1. **referral_count** (Number)
   - Property name: `referral_count`
   - Field type: Number
   - Group: Contact information

2. **last_referral_at** (Date/Time)
   - Property name: `last_referral_at`
   - Field type: Date/Time
   - Group: Contact information

3. **referral_code** (Single-line text)
   - Property name: `referral_code`
   - Field type: Single-line text
   - Group: Contact information

## Step 3: Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
HUBSPOT_API_KEY=your_hubspot_api_token_here
```

## Step 4: Testing the Integration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the sync functionality:**
   - Go to your dashboard
   - Use the "Sync All Users to HubSpot" button to sync existing users
   - Use the "Get Sync Status" button to verify the sync worked

3. **Check HubSpot:**
   - Go to your HubSpot contacts
   - Verify that users are being created/updated
   - Check that referral data is being tracked

## Step 5: Automation Features

### HubSpot Workflows (Optional)

You can create workflows in HubSpot for:

1. **New User Welcome:**
   - Trigger: Contact created
   - Action: Send welcome email

2. **Referral Milestones:**
   - Trigger: `referral_count` changes
   - Actions: Send congratulatory emails, update lead score

3. **High-Performing Referrers:**
   - Trigger: `referral_count` >= 5
   - Action: Add to VIP segment, send special offers

## API Endpoints

### Sync Users
- **POST** `/api/hubspot/sync-users`
  - Syncs all existing users from Supabase to HubSpot
  - Returns sync results with success/failure counts

### Get Sync Status
- **GET** `/api/hubspot/sync-users`
  - Returns current HubSpot sync status
  - Shows recent contacts and referral counts

## Data Flow

1. **User Registration:**
   - User signs up → Supabase user created
   - User automatically synced to HubSpot contact

2. **Referral Creation:**
   - User creates referral → Supabase referral record
   - Referral activity logged in HubSpot

3. **Referral Verification:**
   - Referred user verifies email → Supabase referral status updated
   - Referrer's stats updated in both Supabase and HubSpot
   - Activity note created in HubSpot

## Troubleshooting

### Common Issues

1. **API Token Errors:**
   - Verify your API token is correct
   - Check that the token has the required scopes
   - Ensure the token hasn't expired

2. **Property Mapping Errors:**
   - Verify all custom properties exist in HubSpot
   - Check property names match exactly (case-sensitive)
   - Ensure properties are in the correct group

3. **Rate Limiting:**
   - The integration includes built-in rate limiting
   - If you encounter rate limit errors, the sync will retry automatically

### Debug Logs

Check your console logs for:
- `[HubSpotService]` - HubSpot service operations
- `[UserService]` - User creation and sync operations
- `[ReferralService]` - Referral tracking operations

## Security Considerations

1. **API Token Security:**
   - Never commit API tokens to version control
   - Use environment variables for all sensitive data
   - Rotate tokens regularly

2. **Data Privacy:**
   - Only sync necessary user data
   - Consider GDPR compliance for user data
   - Implement data deletion procedures

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify your HubSpot setup matches this guide
3. Test with a single user first before bulk operations 