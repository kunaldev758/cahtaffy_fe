import { cookies } from "next/headers";
import { hasAuthTokenCookie } from "@/lib/clientCookie";
import ChataffyWebsite from "./chataffy-website";
import { ClearAuthLocalStorageIfNoToken } from "./clear-auth-local-storage-if-no-token";

export default function HomePage() {
  const hasToken = hasAuthTokenCookie(cookies());

  return (
    <>
      <ClearAuthLocalStorageIfNoToken hasToken={hasToken} />
      <ChataffyWebsite />
    </>
  );
}
