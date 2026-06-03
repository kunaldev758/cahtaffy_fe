import { cookies, headers } from "next/headers";
import {
  detectAuthSurface,
  resolveClientSessionToken,
  type AuthSurface,
} from "@/lib/clientAuthContext";

/** Server Actions / RSC: resolve client auth surface from request cookies + referer. */
export function getServerAuthSurface(): AuthSurface {
  const cookieStore = cookies();
  const referer = headers().get("referer");
  return detectAuthSurface({
    cookies: cookieStore,
    referer,
    secFetchDest: headers().get("sec-fetch-dest"),
  });
}

export function getServerClientSessionToken(): string | null {
  const cookieStore = cookies();
  return (
    resolveClientSessionToken({
      cookies: cookieStore,
      referer: headers().get("referer"),
      secFetchDest: headers().get("sec-fetch-dest"),
    }) ?? null
  );
}
