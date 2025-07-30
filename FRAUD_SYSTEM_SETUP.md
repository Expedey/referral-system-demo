# Fraud Tracking System Setup

This guide explains how to set up and use the new fraud tracking system that records users who exceed their attempts.

## 🚀 Quick Setup

### 1. Database Setup
Run the SQL commands from `fraud-schema.sql` in your Supabase database:

```sql
-- Add this to your existing database
CREATE TABLE IF NOT EXISTS public.fraud_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_email TEXT NOT NULL,
  referred_from TEXT,
  fraud_flag BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_fraud_records_ip ON public.fraud_records(ip_address);
CREATE INDEX IF NOT EXISTS idx_fraud_records_email ON public.fraud_records(user_email);
CREATE INDEX IF NOT EXISTS idx_fraud_records_created ON public.fraud_records(created_at);
```

### 2. Files Created
- ✅ `fraud-schema.sql` - Database schema
- ✅ `src/services/fraudService.ts` - Fraud service
- ✅ `src/app/actions/referral.ts` - Updated with fraud recording
- ✅ `src/app/admin/fraud/page.tsx` - Admin fraud page

### 3. Integration Points
- ✅ Server action records fraud when throttling occurs
- ✅ Server action records fraud when validation fails
- ✅ Admin can view fraud records at `/admin/fraud`

## 📊 How It Works

### When Fraud Records Are Created:
1. **IP Throttling Exceeded** - When user hits hourly/daily limits
2. **Validation Failures** - When email validation fails (suspicious patterns)
3. **Rate Limiting** - When user-based rate limits are exceeded

### Data Stored:
- **IP Address** - The violating IP
- **User Email** - The email they tried to register with
- **Referred From** - The referral code they used (if any)
- **Fraud Flag** - Always `true` for these records
- **Timestamp** - When the violation occurred

## 🎯 Admin Features

### Fraud Dashboard (`/admin/fraud`)
- **Statistics Cards**: Total records, today's records, unique IPs, unique emails
- **Filtering**: By IP address, email, date range
- **Fraud Records Table**: Shows all fraud attempts with details
- **Real-time Updates**: Data refreshes automatically

### Table Columns:
- IP Address
- Email
- Referred From (referral code)
- Date/Time
- Status (Fraud flag)

## 🔧 Configuration

### Throttling Limits (in `src/utils/ipThrottling.ts`):
```typescript
const DEFAULT_CONFIG: ThrottleConfig = {
  maxAttemptsPerHour: 10,    // Change this
  maxVerificationsPerDay: 5, // Change this
};
```

### User Rate Limiting (in `src/utils/antiFraud.ts`):
```typescript
private static readonly MAX_SUBMISSIONS = 15; // Max submissions per hour
private static readonly WINDOW_MS = 60 * 60 * 1000; // 1 hour window
```

## 📈 Monitoring

### View Fraud Records:
1. Go to `/admin/fraud`
2. Use filters to search specific IPs or emails
3. View statistics in the dashboard cards
4. Export data if needed (can be added later)

### Common Scenarios:
- **High IP violations**: Multiple attempts from same IP
- **Suspicious emails**: Test accounts, fake emails
- **Rapid submissions**: Users trying to spam the system

## 🛡️ Security Benefits

1. **Fraud Detection**: Automatically flags suspicious activity
2. **IP Tracking**: Monitors repeated violations from same IP
3. **Email Pattern Detection**: Catches test/fake email patterns
4. **Admin Visibility**: Complete view of all fraud attempts
5. **Historical Data**: Track patterns over time

## 🔄 Integration with Existing System

The fraud system integrates seamlessly with your existing:
- ✅ IP throttling system
- ✅ User rate limiting
- ✅ Email validation
- ✅ Admin dashboard
- ✅ Referral creation flow

No existing code was modified - only new components were added!

## 🚀 Next Steps

1. **Run the database schema** in your Supabase dashboard
2. **Test the system** by exceeding limits
3. **Check the admin fraud tab** to see records
4. **Adjust limits** if needed for your use case

The system is now ready to track and display fraud attempts! 🎉 