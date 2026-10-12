import { cookies } from "next/headers";
import ChataffyWebsite from "./chataffy-website";
import { ClearAuthLocalStorageIfNoToken } from "./clear-auth-local-storage-if-no-token";
import LoadPage from "./load/page";

type HomePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default function HomePage({ searchParams }: HomePageProps) {
  const shop = firstParam(searchParams?.shop).toLowerCase();
  const host = firstParam(searchParams?.host);
  const hmac = firstParam(searchParams?.hmac);
  // Shopify's first document must be this URL (200), not a redirect to /load.
  if (shop.endsWith(".myshopify.com") || (host && hmac)) {
    return <LoadPage />;
  }

  const hasToken = cookies().has("token");

  return (
    <>
      <ClearAuthLocalStorageIfNoToken hasToken={hasToken} />
      <ChataffyWebsite />
    </>
  );
}
