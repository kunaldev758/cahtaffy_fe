import { headers } from "next/headers";

import { SHOPIFY_APP_BRIDGE_HEADER } from "@/lib/shopifyEmbed";

export default async function ShopifyAppBridgeHead() {
  const headersList = await headers();
  if (headersList.get(SHOPIFY_APP_BRIDGE_HEADER) !== "1") {
    return null;
  }

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return (
    <>
      <meta name="shopify-api-key" content={apiKey} />
      <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
    </>
  );
}
