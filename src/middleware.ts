// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { checkIPThrottle, recordIPAttempt } from '@/utils/ipThrottling';

// // Simple IP extraction function
// function getRequestIP(request: NextRequest): string {
//   // Try different headers for IP detection
//   const forwardedFor = request.headers.get('x-forwarded-for');
//   const realIP = request.headers.get('x-real-ip');
//   const cfConnectingIP = request.headers.get('cf-connecting-ip');

//   // Use the first available IP
//   const ip = forwardedFor?.split(',')[0] || realIP || cfConnectingIP || 'unknown';

//   return ip;
// }

// /**
//  * Middleware for IP throttling on referral API endpoints
//  * Implements basic fraud prevention as pre-flight check
//  */
// export function middleware(request: NextRequest) {
//   // Admin route protection
//   if (request.nextUrl.pathname.startsWith('/admin') &&
//       !request.nextUrl.pathname.startsWith('/admin/login') &&
//       !request.nextUrl.pathname.startsWith('/admin/api')) {
//     // For now, we'll let the client-side route guard handle admin authentication
//     // In production, you might want to add server-side session validation here
//     return NextResponse.next();
//   }

//   // Only apply to referral API routes (not signup page)
//   if (request.nextUrl.pathname.startsWith('/api/referral')) {
//     try {
//       // Get client IP
//       const clientIP = getRequestIP(request);

//       // Check IP throttling
//       const throttleCheck = checkIPThrottle(clientIP);

//       if (throttleCheck.throttled) {
//         // Return rate limit error
//         return NextResponse.json(
//           {
//             success: false,
//             error: 'Rate limit exceeded',
//             reason: throttleCheck.reason,
//             remainingAttempts: throttleCheck.remainingAttempts,
//             remainingVerifications: throttleCheck.remainingVerifications,
//           },
//           { status: 429 }
//         );
//       }

//       // Record the attempt for API calls
//       recordIPAttempt(clientIP, false);

//       // Continue with the request
//       return NextResponse.next();
//     } catch (error) {
//       console.error('Error in IP throttling middleware:', error);
//       // Continue with request if throttling fails
//       return NextResponse.next();
//     }
//   }

//   // Continue with other routes
//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     '/api/referral/:path*',
//     '/admin/:path*',
//   ],
// };

import { type NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
