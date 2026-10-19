import { NextRequest, NextResponse } from "next/server";

export const SHOPIFY_APP_BRIDGE_HEADER = "x-chataffy-shopify-app-bridge";
export const SHOPIFY_GATE_COOKIE = "shopify_gate_ok";

function shopifyApiBase(): string {
  return String(process.env.NEXT_PUBLIC_API_HOST || "")
    .trim()
    .replace(/\/$/, "");
}

/**
 * If Shopify opened our app but env credentials have not passed OAuth yet,
 * send the request to the backend gate. That uses SHOPIFY_CLIENT_ID from
 * .env (dynamic). A bad id never reaches /load or App Bridge — Shopify
 * shows application_cannot_be_found instead of installing another app.
 */
export function redirectShopifyToCredentialGate(
  request: NextRequest,
): NextResponse | null {
  const { searchParams } = request.nextUrl;
  if (searchParams.get("signed_payload_jwt")) return null;

  const shop = searchParams.get("shop");
  if (!shop || !shop.includes(".myshopify.com")) return null;

  if (request.cookies.get(SHOPIFY_GATE_COOKIE)?.value === shop) {
    return null;
  }

  const apiBase = shopifyApiBase();
  if (!apiBase) return null;

  const gate = new URL(`${apiBase}/api/shopify/auth/gate`);
  searchParams.forEach((value, key) => {
    gate.searchParams.set(key, value);
  });
  return NextResponse.redirect(gate);
}

/**
 * Whether the HTML response should include Shopify App Bridge (embedded Shopify only).
 * Excludes standalone local web and BigCommerce.
 * Do not inject App Bridge until OAuth with the env client_id has succeeded;
 * loading App Bridge with NEXT_PUBLIC_SHOPIFY_API_KEY installs that app.
 */
export function shouldLoadShopifyAppBridge(request: NextRequest): boolean {
  const platform = request.cookies.get("platform")?.value;

  if (platform === "bigcommerce" || platform === "local") return false;

  const { searchParams } = request.nextUrl;
  if (searchParams.get("signed_payload_jwt")) return false;

  const shop = searchParams.get("shop");
  const host = searchParams.get("host");
  const hmac = searchParams.get("hmac");
  if (shop || host || hmac) {
    return request.cookies.get(SHOPIFY_GATE_COOKIE)?.value === shop;
  }

  return platform === "shopify";
}

export function continueWithOptionalShopifyHeader(
  request: NextRequest,
): NextResponse {
  if (!shouldLoadShopifyAppBridge(request)) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SHOPIFY_APP_BRIDGE_HEADER, "1");

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
