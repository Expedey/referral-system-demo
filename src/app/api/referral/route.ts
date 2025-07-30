import { NextRequest, NextResponse } from 'next/server';
import { checkIPThrottle } from '@/utils/ipThrottling';

// Simple IP extraction function
function getRequestIP(request: NextRequest): string {
  // Try different headers for IP detection
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  // Use the first available IP
  const ip = forwardedFor?.split(',')[0] || realIP || cfConnectingIP || 'unknown';
  
  return ip;
}

/**
 * GET endpoint to check current IP limits and get client IP
 * Used for debugging and IP detection
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
        maxAttemptsPerHour: 2,
        maxVerificationsPerDay: 1,
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

/**
 * POST endpoint for referral operations (legacy support)
 * Note: Main referral creation is now handled by server actions
 */
export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Use server actions for referral creation',
    message: 'Referral creation has been moved to server actions for better IP detection and security',
  }, { status: 400 });
} 