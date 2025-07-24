import { NextRequest, NextResponse } from 'next/server';
import { checkIPThrottle, recordIPAttempt } from '@/utils/ipThrottling';

// Simple IP extraction function
function getRequestIP(request: NextRequest): string {
  // Try different headers for IP detection
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  // Use the first available IP
  const ip = forwardedFor?.split(',')[0] || realIP || cfConnectingIP || 'unknown';
  
  // Handle localhost for development
  if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
    return '8.8.8.8'; // Placeholder for development
  }
  
  return ip;
}

/**
 * IP throttling middleware for referral endpoints
 * Implements basic fraud prevention with rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const clientIP = getRequestIP(request);
    
    // Check IP throttling before processing
    const throttleCheck = checkIPThrottle(clientIP);
    
    if (throttleCheck.throttled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          reason: throttleCheck.reason,
          remainingAttempts: throttleCheck.remainingAttempts,
          remainingVerifications: throttleCheck.remainingVerifications,
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Record this attempt
    recordIPAttempt(clientIP, false);

    // Parse request body
    const body = await request.json();
    const { referralCode, email, action } = body;

    // Process the referral request
    let isVerification = false;
    
    if (action === 'verify') {
      isVerification = true;
      // Record verification attempt
      recordIPAttempt(clientIP, true);
    }

    // Your existing referral logic here
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Referral processed successfully',
      ip: clientIP,
      remainingAttempts: throttleCheck.remainingAttempts - 1,
      remainingVerifications: throttleCheck.remainingVerifications,
    });

  } catch (error) {
    console.error('Error in referral API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check current IP limits
 */
export async function GET(request: NextRequest) {
  try {
    const clientIP = getRequestIP(request);
    const throttleCheck = checkIPThrottle(clientIP);
    
    return NextResponse.json({
      success: true,
      ip: clientIP,
      throttled: throttleCheck.throttled,
      remainingAttempts: throttleCheck.remainingAttempts,
      remainingVerifications: throttleCheck.remainingVerifications,
      limits: {
        maxAttemptsPerHour: 10,
        maxVerificationsPerDay: 5,
      },
    });
  } catch (error) {
    console.error('Error checking IP limits:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
} 