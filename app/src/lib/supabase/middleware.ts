import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase auth middleware — refreshes session on every request.
 * Protects /dashboard/* and /admin/* routes.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect dashboard and admin routes
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from auth pages.
  // getUser() above may have rotated the refresh token and written the new auth
  // cookies onto `supabaseResponse` via setAll. A fresh NextResponse.redirect()
  // carries none of them, so the rotated tokens would never reach the browser
  // while the old refresh token is already spent — an intermittent login loop.
  // Copy them across before returning.
  if (user && pathname.startsWith("/auth/")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    const redirectRes = NextResponse.redirect(dashboardUrl);
    supabaseResponse.cookies.getAll().forEach((c) => redirectRes.cookies.set(c));
    return redirectRes;
  }

  return supabaseResponse;
}
