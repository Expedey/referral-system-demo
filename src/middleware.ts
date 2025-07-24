import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
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
 * Middleware for IP throttling on referral endpoints
 * Implements basic fraud prevention as pre-flight check
 */
export function middleware(request: NextRequest) {
  // Only apply to referral-related routes
  if (
    request.nextUrl.pathname.startsWith('/api/referral') ||
    request.nextUrl.pathname.startsWith('/ref/') ||
    request.nextUrl.pathname === '/signup'
  ) {
    try {
      // Get client IP
      const clientIP = getRequestIP(request);
      
      // Check IP throttling
      const throttleCheck = checkIPThrottle(clientIP);
      
      if (throttleCheck.throttled) {
        // Return rate limit error
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            reason: throttleCheck.reason,
            remainingAttempts: throttleCheck.remainingAttempts,
            remainingVerifications: throttleCheck.remainingVerifications,
          },
          { status: 429 }
        );
      }

      // Record the attempt for API calls
      if (request.nextUrl.pathname.startsWith('/api/referral')) {
        recordIPAttempt(clientIP, false);
      }

      // Continue with the request
      return NextResponse.next();
    } catch (error) {
      console.error('Error in IP throttling middleware:', error);
      // Continue with request if throttling fails
      return NextResponse.next();
    }
  }

  // Continue with other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/referral/:path*',
    '/ref/:path*',
    '/signup',
  ],
}; 