import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[Middleware] user:", user);

  // Define route categories
  const guestRoutes = [
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  const protectedRoutes = ["/dashboard", "/leaderboard"];

  // const publicRoutes = ["/error", "/ref/"];

  // Helper function to check if path starts with any route in array
  const isRouteInCategory = (pathname: string, routes: string[]): boolean => {
    return routes.some((route) => pathname.startsWith(route));
  };

  // Handle authenticated users
  if (user) {
    // Redirect authenticated users away from guest routes
    if (isRouteInCategory(request.nextUrl.pathname, guestRoutes)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }
  // Handle unauthenticated users
  else {
    // Redirect unauthenticated users away from protected routes
    if (isRouteInCategory(request.nextUrl.pathname, protectedRoutes)) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
