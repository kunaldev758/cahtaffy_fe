import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const appUrl: any = process.env.NEXT_PUBLIC_APP_URL;

  // Make sure appUrl ends with a slash for consistency
  const baseUrl = appUrl.endsWith('/') ? appUrl : appUrl + '/';

  const agentRoutes = [
    '/agent-inbox',
    '/agent-login'
  ]

  if (cookies().has('token') && pathname.startsWith('/login')) {
    return NextResponse.redirect(baseUrl + 'dashboard');
  }
  const currentUserrole = cookies().get('role')?.value
if (cookies().has('token') && currentUserrole === 'agent') {
  if (agentRoutes.includes(pathname)) {
    // Already on an allowed route, do nothing
    return NextResponse.next();
  } else {
    const redirectUrl = baseUrl + 'agent-inbox';
    if (pathname !== '/agent-inbox') {
      return NextResponse.redirect(redirectUrl);
    }
  }
}

  if (!cookies().has('token') && !pathname.startsWith('/login')) {
    return NextResponse.redirect(baseUrl + 'login');
  }
}
export const config = {
  matcher: [
    '/((?!api|favicon.ico|verify-email|signup|widget|openai/widget|tensorflow/widget|_next|images).*)',
  ],
};
