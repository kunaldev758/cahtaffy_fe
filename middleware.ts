import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const appUrl: any = process.env.NEXT_PUBLIC_APP_URL;

  const baseUrl = appUrl.endsWith("/") ? appUrl : appUrl + "/";

  const cookieStore = cookies();
  const hasToken = cookieStore.has("token");
  const currentUserRole = cookieStore.get("role")?.value;

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
    if (agentRoutes.includes(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(baseUrl + "agent-login");
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
    "/((?!api|favicon.ico|verify-email|signup|widget|openai/widget|tensorflow/widget|_next|images).*)",
  ],
};