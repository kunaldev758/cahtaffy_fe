import { NextRequest,NextResponse } from 'next/server';
import { cookies } from 'next/headers';


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const appUrl:any = process.env.NEXT_PUBLIC_APP_URL;
  
  // Make sure appUrl ends with a slash for consistency
  const baseUrl = appUrl.endsWith('/') ? appUrl : appUrl + '/';
  
  if (cookies().has('token') && pathname.startsWith('/login')) {
    return NextResponse.redirect(baseUrl + 'dashboard');
  }

  // if (!cookies().has('token') && !pathname.startsWith('/login')) {
  //   return NextResponse.redirect(baseUrl + 'login');
  // }
}
export const config = {
  matcher: [
   '/((?!api|favicon.ico|verify-email|signup|widget|openai/widget|tensorflow/widget|_next|images).*)',
  ],
};
