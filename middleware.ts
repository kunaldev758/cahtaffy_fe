import { NextRequest,NextResponse } from 'next/server';
import { cookies } from 'next/headers';


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (cookies().has('token') && pathname.startsWith('/login')) {
    return NextResponse.redirect(appUrl+'dashboard');
  }

  if (!cookies().has('token') && !pathname.startsWith('/login')) {
    return NextResponse.redirect(appUrl+'login');
  }
}

export const config = {
  matcher: [
   '/((?!api|favicon.ico|verify-email|signup|widget|openai/widget|tensorflow/widget|_next|images).*)',
  ],
};
