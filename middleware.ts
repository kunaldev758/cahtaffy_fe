import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export function middleware(request: NextRequest) {
  let { pathname } = request.nextUrl;
  const appUrl: any = process.env.NEXT_PUBLIC_APP_URL;

  const baseUrl = appUrl.endsWith("/") ? appUrl : appUrl + "/";

  // Normalize pathname by removing base path prefix if present (for production)
  // This handles paths like /chataffy/cahtaffy_fe/agent-inbox -> /agent-inbox
  const basePathPrefix = "/chataffy/cahtaffy_fe";
  if (pathname.startsWith(basePathPrefix)) {
    pathname = pathname.slice(basePathPrefix.length) || "/";
  }

  const cookieStore = cookies();
  const hasToken = cookieStore.has("token");
  const currentUserRole = cookieStore.get("role")?.value;

  // Log ALL requests for debugging
  console.log("[Middleware] 📥 Request:", {
    method: request.method,
    originalPathname: request.nextUrl.pathname,
    normalizedPathname: pathname,
    hasToken,
    currentUserRole,
    url: request.url
  });

  const publicRoutes = ["/login", "/agent-login", "/agent-accept-invite"];
  const agentRoutes = ["/agent-inbox", "/agent-login", "/agent-accept-invite"];
  const visitorAllowedPrefix = "/openai/widget";

  // 🚫 Not logged in
  if(pathname == "/"){
    return NextResponse.next();
  }

  if (!hasToken) {
    // allow only login/agent-login/accept-invite/widget
    if (
      publicRoutes.includes(pathname) ||
      pathname.startsWith(visitorAllowedPrefix)
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(baseUrl);
  }

  // ✅ Logged in
  if (currentUserRole === "agent") {
    // Check if pathname matches any agent route (with or without query params)
    // Remove query string and trailing slash for comparison
    const pathnameWithoutQuery = pathname.split("?")[0].replace(/\/$/, '');
    const normalizedAgentRoutes = agentRoutes.map(route => route.replace(/\/$/, ''));
    
    // Debug logging (check server console, not browser console)
    console.log("[Middleware] 🔍 Agent route check - BEFORE decision:", {
      originalPathname: request.nextUrl.pathname,
      normalizedPathname: pathname,
      pathnameWithoutQuery,
      normalizedAgentRoutes,
      matches: normalizedAgentRoutes.includes(pathnameWithoutQuery),
      hasToken,
      currentUserRole,
      fullUrl: request.url
    });
    
    if (normalizedAgentRoutes.includes(pathnameWithoutQuery)) {
      console.log("[Middleware] ✅ Allowing agent access to:", pathnameWithoutQuery);
      return NextResponse.next();
    }
    
    // If we get here, the route doesn't match - redirect to agent-login
    console.log("[Middleware] ❌ Route NOT allowed for agent:", {
      pathnameWithoutQuery,
      allowedRoutes: normalizedAgentRoutes,
      redirectingTo: "/agent-login"
    });
    const originalPathname = request.nextUrl.pathname;
    const isProduction = originalPathname.startsWith(basePathPrefix);
    const redirectPath = isProduction ? `${basePathPrefix}/agent-login` : "/agent-login";
    const redirectUrl = new URL(redirectPath, request.nextUrl.origin);
    console.log("[Middleware] 🔄 Redirecting agent to:", redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }

  if (currentUserRole === "client") {
    // client can access everything
    return NextResponse.next();
  }

  // If role is missing/invalid but token exists → treat as visitor
  if (pathname.startsWith(visitorAllowedPrefix)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(baseUrl);
}

export const config = {
  matcher: [
    "/((?!api|favicon.ico|verify-email|signup|widget|openai/widget|tensorflow/widget|_next|images|audio|\.well-known).*)",
  ],
};