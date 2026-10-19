import { NextRequest, NextResponse } from "next/server";

import { serverEmbeddedAuthCookieOpts } from "@/lib/authCookies";
import { SHOPIFY_GATE_COOKIE } from "@/lib/shopifyEmbed";

function verifyGateUrl(ticket: string): string {
  const apiHost = String(
    process.env.API_HOST || `${process.env.NEXT_PUBLIC_API_HOST || ""}/api/`,
  ).replace(/\/?$/, "/");
  const url = new URL("shopify/auth/verify-gate", apiHost);
  url.searchParams.set("ticket", ticket);
  return url.toString();
}

export async function GET(request: NextRequest) {
  const ticket = request.nextUrl.searchParams.get("ticket") || "";
  if (!ticket) {
    return NextResponse.redirect(new URL("/load", request.url));
  }

  let data: { ok?: boolean; shop?: string; clientId?: string } = {};
  try {
    const verify = await fetch(verifyGateUrl(ticket), { cache: "no-store" });
    data = await verify.json();
  } catch {
    data = {};
  }

  if (!data?.ok || !data.shop || !data.clientId) {
    return NextResponse.redirect(new URL("/load", request.url));
  }

  // After OAuth callback, redirect to our own /load page with the shop param so
  // App Bridge can take over.  Previously we redirected to
  //   https://{shop}/admin/apps/{clientId}
  // which opens Shopify's own admin, and that page refuses to be embedded in an
  // iframe (X-Frame-Options: DENY), causing "admin.shopify.com refused to connect".
  const loadUrl = new URL("/load", request.url);
  loadUrl.searchParams.set("shop", data.shop);

  const res = NextResponse.redirect(loadUrl);
  res.cookies.set({
    name: SHOPIFY_GATE_COOKIE,
    value: data.shop,
    ...serverEmbeddedAuthCookieOpts(),
    maxAge: 60 * 60,
  });
  return res;
}
