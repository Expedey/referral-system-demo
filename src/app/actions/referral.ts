'use server';

import { headers } from 'next/headers';
import { ReferralService } from '@/services/referralService';
import { FraudService } from '@/services/fraudService';
import { checkIPThrottle, recordIPAttempt } from '@/utils/ipThrottling';

/**
 * Server action for creating referrals with proper IP detection and throttling
 */
export async function createReferralAction(referralData: {
  referrerId: string;
  referredEmail: string;
  referredUserId: string;
  userAgent?: string;
  userType?: 'regular' | 'corporate';
}) {
  try {
    // Get client IP from headers
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIP = headersList.get('x-real-ip');
    const cfConnectingIP = headersList.get('cf-connecting-ip');
    
    // Use the first available IP
    const clientIP = forwardedFor?.split(',')[0] || realIP || cfConnectingIP || 'unknown';
    
    console.log(`[ReferralAction] Detected IP: ${clientIP}`);

    // Check IP throttling
    const throttleCheck = checkIPThrottle(clientIP);
    
    if (throttleCheck.throttled) {
      console.log(`[ReferralAction] IP throttled: ${throttleCheck.reason}`);
      
      // Record fraud attempt when throttling occurs
      await FraudService.recordFraudAttempt({
        ipAddress: clientIP,
        userEmail: referralData.referredEmail,
        referredFrom: referralData.referrerId,
        reason: throttleCheck.reason || 'IP throttling exceeded'
      });
      
      return { 
        success: false, 
        error: throttleCheck.reason || 'Rate limit exceeded',
        throttled: true,
        remainingAttempts: throttleCheck.remainingAttempts,
        remainingVerifications: throttleCheck.remainingVerifications,
      };
    }

    // Record the attempt
    recordIPAttempt(clientIP, false);
    console.log(`[ReferralAction] IP attempt recorded for: ${clientIP}`);

    // Create referral with IP and user type
    const referral = await ReferralService.createReferral({
      ...referralData,
      userIp: clientIP,
    });

    return { success: true, referral };
  } catch (error) {
    console.error('[ReferralAction] Error creating referral:', error);
    
    // Record fraud attempt for other errors (like validation failures)
    if (error instanceof Error && error.message.includes('Invalid referral data')) {
      const headersList = await headers();
      const forwardedFor = headersList.get('x-forwarded-for');
      const realIP = headersList.get('x-real-ip');
      const cfConnectingIP = headersList.get('cf-connecting-ip');
      const clientIP = forwardedFor?.split(',')[0] || realIP || cfConnectingIP || 'unknown';
      
      await FraudService.recordFraudAttempt({
        ipAddress: clientIP,
        userEmail: referralData.referredEmail,
        referredFrom: referralData.referrerId,
        reason: error.message
      });
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create referral' 
    };
  }
} 