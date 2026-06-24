import { NextRequest, NextResponse } from "next/server";

export const SHOPIFY_APP_BRIDGE_HEADER = "x-chataffy-shopify-app-bridge";

/**
 * Whether the HTML response should include Shopify App Bridge (embedded Shopify only).
 * Excludes standalone local web and BigCommerce.
 */
export function shouldLoadShopifyAppBridge(request: NextRequest): boolean {
  const platform = request.cookies.get("platform")?.value;

  if (platform === "bigcommerce" || platform === "local") return false;

  const { searchParams } = request.nextUrl;
  if (searchParams.get("signed_payload_jwt")) return false;

  const shop = searchParams.get("shop");
  const host = searchParams.get("host");
  const hmac = searchParams.get("hmac");
  if (shop || host || hmac) return true;

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
