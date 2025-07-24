# Basic IP Fraud Check System

A simple IP throttling system to prevent basic referral fraud.

## 🎯 What It Does

- **Limits attempts per hour**: Max 10 referral attempts per IP per hour
- **Limits verifications per day**: Max 5 verified referrals per IP per day
- **Returns clear errors**: When limits are reached, users get clear feedback
- **Pre-flight checks**: Runs before processing referral requests

## 📁 Files Created

### 1. `src/utils/ipThrottling.ts`
Core throttling logic with:
- `checkIPThrottle()` - Check if IP is throttled
- `recordIPAttempt()` - Record an attempt
- `getIPStats()` - Get current IP statistics

### 2. `src/app/api/referral/route.ts`
API endpoint with IP throttling middleware:
- `POST` - Process referral with throttling
- `GET` - Check current IP limits

### 3. `src/middleware.ts`
Next.js middleware for pre-flight IP checks on referral routes.

## 🚀 How to Use

### 1. Test the API
```bash
# Check your current limits
curl http://localhost:3000/api/referral

# Submit a referral (will be throttled after 10 attempts/hour)
curl -X POST http://localhost:3000/api/referral \
  -H "Content-Type: application/json" \
  -d '{"referralCode": "ABC123", "email": "test@example.com"}'
```

### 2. Integration with Your App
```typescript
// In your referral service
import { checkIPThrottle, recordIPAttempt } from '@/utils/ipThrottling';

export async function createReferral(ip: string, data: any) {
  // Check throttling first
  const throttleCheck = checkIPThrottle(ip);
  
  if (throttleCheck.throttled) {
    throw new Error(throttleCheck.reason);
  }
  
  // Record attempt
  recordIPAttempt(ip, false);
  
  // Process referral...
}
```

## ⚙️ Configuration

Edit the limits in `src/utils/ipThrottling.ts`:

```typescript
const DEFAULT_CONFIG: ThrottleConfig = {
  maxAttemptsPerHour: 10,    // Change this
  maxVerificationsPerDay: 5, // Change this
};
```

## 🔍 Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Referral processed successfully",
  "ip": "192.168.1.1",
  "remainingAttempts": 9,
  "remainingVerifications": 5
}
```

### Throttled Response
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "reason": "Maximum 10 attempts per hour reached",
  "remainingAttempts": 0,
  "remainingVerifications": 5
}
```

## 🛡️ How It Prevents Fraud

1. **Rate Limiting**: Prevents spam referrals from same IP
2. **Verification Limits**: Stops multiple account creation
3. **Clear Feedback**: Users know when they're blocked
4. **Pre-flight Checks**: Catches abuse before processing

## 📊 Monitoring

Check IP statistics:
```typescript
import { getIPStats } from '@/utils/ipThrottling';

const stats = getIPStats('192.168.1.1');
console.log(stats);
// { attemptsLastHour: 3, verificationsLastDay: 1 }
```

## 🔧 Production Notes

- **Memory Storage**: Currently uses in-memory storage
- **Redis Recommended**: For production, use Redis for persistence
- **Cleanup**: Call `cleanupOldRecords()` periodically
- **Scaling**: Consider database storage for multiple servers

## 🎯 Simple & Effective

This basic system provides:
- ✅ IP throttling logic
- ✅ Pre-flight checks on referral endpoints
- ✅ Hourly and daily limits
- ✅ Clear error messages
- ✅ Easy configuration

Perfect for basic fraud prevention without complexity! 