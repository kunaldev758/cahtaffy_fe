import { cookies } from "next/headers";
import ChataffyWebsite from "./chataffy-website";
import { ClearAuthLocalStorageIfNoToken } from "./clear-auth-local-storage-if-no-token";

export default function HomePage() {
  const hasToken = cookies().has("token");

  return (
    <>
      <ClearAuthLocalStorageIfNoToken hasToken={hasToken} />
      <ChataffyWebsite />
    </>
  );
}
