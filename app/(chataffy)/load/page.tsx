// "use client";

// import { useRouter, useSearchParams } from "next/navigation";
// import { Suspense, useEffect, useState } from "react";
// import { dispatchAuthStorageSync, useSocket } from "../../socketContext";
// import axios from "axios";
// import { bcAuthLoadApi, sfAuthLoadApi } from "@/app/_api/login/action";

// // Extend window type for App Bridge
// declare global {
//   interface Window {
//     shopify?: {
//       idToken: () => Promise<string>;
//       config: {
//         shop: string;
//         locale: string;
//         version: string;
//       };
//     };
//   }
// }

// function LoadPageContent() {
//   const { socket } = useSocket();
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const [error, setError] = useState("");

//   const handleSocketEvent = (userId: any) => {
//     if (socket) {
//       socket.on("user-logged-in", () => {
//         socket.emit("join", userId);
//       });
//     }
//   };

//   function redirectToInstall(url: string) {
//     if (typeof window === "undefined") return;
//     const embedded = window.self !== window.top;
//     if (embedded) {
//       queueMicrotask(() => {
//         window.open(url, "_top");
//       });
//       return;
//     }
//     window.location.href = url;
//      // 👇 New tab — do NOT redirect to Shopify
//     // return false;
//   }

//   useEffect(() => {
//     const verifyAndRedirect = async () => {
//       try {
//         const signedPayload = searchParams?.get("signed_payload_jwt");
//         const shop = searchParams?.get("shop");
//         const host = searchParams?.get("host");
//         const apiBase = process.env.NEXT_PUBLIC_API_HOST;

//         // ── BigCommerce (unchanged) ──────────────────────────────────────
//         if (signedPayload) {
//           // const res = await axios.get(`${apiBase}/api/bigcommerce/auth/load`, {
//           //   params: { signed_payload_jwt: signedPayload },
//           //   withCredentials: true,
//           // });
//           const res = await bcAuthLoadApi(signedPayload);
//           console.log(res, "this is the response bigcommerce!");
//           const result = res;
//           if (result.status) {
//             const { userId, isOnboarded, agents, bigcommerceStoreHash } =
//               result;
//             sessionStorage.setItem("userId", userId);
//             sessionStorage.setItem("agents", JSON.stringify(agents));
//             sessionStorage.setItem("currentAgentId", agents[0]?._id ?? "");
//             sessionStorage.setItem("provider", "bigcommerce");
//             sessionStorage.setItem("bcStoreHash", bigcommerceStoreHash || "");
//             sessionStorage.setItem("signedPayloadJwt", signedPayload || "");
//             sessionStorage.removeItem("sf_params");
//             sessionStorage.removeItem("shopifyShop");
//             dispatchAuthStorageSync();
//             handleSocketEvent(result.userId);
//             router.replace(isOnboarded ? "/dashboard" : "/onboarding");
//           }
//           return;
//         }

//         // ── Shopify ──────────────────────────────────────────────────────
//         if (shop) {
//           try {
//             // Get session token from new App Bridge via window.shopify
//             let id_token: string | null = searchParams?.get("id_token") ?? null;

//             if (typeof window !== "undefined" && window.shopify?.idToken) {
//               try {
//                 id_token = await window.shopify.idToken();
//               } catch (tokenErr) {
//                 console.warn(
//                   "Could not get App Bridge session token:",
//                   tokenErr,
//                 );
//               }
//             }

//             // Build params — prefer id_token, fallback to install_token etc.
//             const allParams = Object.fromEntries(searchParams?.entries() ?? []);
//             // const params = id_token
//             //   ? { shop, host, id_token } // App Bridge flow (normal load)
//             //   : allParams; // Post-install flow (install_token)
//             const params = allParams;

//             // const res = await axios.get(`${apiBase}/api/shopify/auth/load`, {
//             //   params,
//             //   withCredentials: true,
//             // });
//             const res = await sfAuthLoadApi(params);
//             console.log(res, "this is the response shopify!");
//             const result = res;
//             if (result.status) {
//               const { userId, isOnboarded, agents, shopifyShop } = result;
//               sessionStorage.setItem("userId", userId);
//               sessionStorage.setItem("agents", JSON.stringify(agents));
//               sessionStorage.setItem("currentAgentId", agents[0]?._id ?? "");
//               sessionStorage.setItem("provider", "shopify");
//               sessionStorage.setItem("shopifyShop", shopifyShop || shop || "");
//               sessionStorage.setItem("sf_params", searchParams?.toString() || "");
//               sessionStorage.removeItem("signedPayloadJwt");
//               sessionStorage.removeItem("bcStoreHash");
//               dispatchAuthStorageSync();
//               handleSocketEvent(result.userId);
//               router.replace(isOnboarded ? "/dashboard" : "/onboarding");
//             }
//           } catch (shopifyErr) {
//             if (axios.isAxiosError(shopifyErr)) {
//               const status = shopifyErr.response?.status;

//               // Not installed or uninstalled → trigger OAuth
//               if (status === 400 || status === 401 || status === 403) {
//                 if (shop) {
//                   const installUrl = new URL(
//                     `${process.env.NEXT_PUBLIC_API_HOST}/api/shopify/auth/install`
//                   );
//                   installUrl.searchParams.set("shop", shop);
//                   if (host) installUrl.searchParams.set("host", host);
          
//                   redirectToInstall(installUrl.toString());
//                   return;
//                 }
//               }
//             }
//             throw shopifyErr;
//           }
//           return;
//         }

//         setError(
//           "Authentication Failed."
//         );
//       } catch (e) {
//         const message = axios.isAxiosError(e)
//           ? String(
//               e.response?.data?.message || e.response?.data?.error || e.message,
//             )
//           : e instanceof Error
//             ? e.message
//             : "Authentication failed";
//         setError(String(message || "Authentication failed"));
//       }
//     };

//     verifyAndRedirect();
//   }, [searchParams]);

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen w-full">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
//           <p>{error}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex items-center justify-center min-h-screen w-full">
//       <div className="text-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
//         <p>Loading your app...</p>
//       </div>
//     </div>
//   );
// }

// export default function LoadPage() {
//   return (
//     <Suspense
//       fallback={
//         <div className="flex items-center justify-center min-h-screen">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
//             <p>Loading...</p>
//           </div>
//         </div>
//       }
//     >
//       <LoadPageContent />
//     </Suspense>
//   );
// }


"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { dispatchAuthStorageSync, useSocket } from "../../socketContext";
import { bcAuthLoadApi, sfAuthLoadApi } from "@/app/_api/login/action";
import { setSocketToken } from "@/lib/socketSession";

function getHttpStatusFromLoadResult(result: unknown): number | undefined {
  if (result && typeof result === "object" && "httpStatus" in result) {
    const status = (result as { httpStatus?: unknown }).httpStatus;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return "Authentication failed";
}

// Extend window type for App Bridge
declare global {
  interface Window {
    shopify?: {
      idToken: () => Promise<string>;
      config: {
        shop: string;
        locale: string;
        version: string;
      };
    };
  }
}

function LoadPageContent() {
  const { socket } = useSocket();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendingJoinUserId, setPendingJoinUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !pendingJoinUserId) return;
    socket.emit("join", pendingJoinUserId);
    setPendingJoinUserId(null);
  }, [socket, pendingJoinUserId]);

  function redirectToInstall(url: string) {
    if (typeof window === "undefined") return;
    const embedded = window.self !== window.top;
    if (embedded) {
      queueMicrotask(() => {
        window.open(url, "_top");
      });
      return;
    }
    window.location.href = url;
  }

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        const signedPayload = searchParams?.get("signed_payload_jwt");
        const shop = searchParams?.get("shop");
        const host = searchParams?.get("host");
        const apiBase = process.env.NEXT_PUBLIC_API_HOST;

        // ── BigCommerce (unchanged) ──────────────────────────────────────
        if (signedPayload) {
          // const res = await axios.get(`${apiBase}/api/bigcommerce/auth/load`, {
          //   params: { signed_payload_jwt: signedPayload },
          //   withCredentials: true,
          // });
          const res = await bcAuthLoadApi(signedPayload);
          const result = res;
          if (result.status) {
            const { userId, isOnboarded, agents, bigcommerceStoreHash, bigcommerceStoreUrl, token } =
              result;
            if (token) {
              setSocketToken("client", token);
            }
            sessionStorage.setItem("userId", userId);
            sessionStorage.setItem("agents", JSON.stringify(agents));
            sessionStorage.setItem("currentAgentId", agents[0]?._id ?? "");
            sessionStorage.setItem("provider", "bigcommerce");
            sessionStorage.setItem("bcStoreHash", bigcommerceStoreHash || "");
            sessionStorage.setItem("bcStoreUrl", bigcommerceStoreUrl || "");
            sessionStorage.setItem("signedPayloadJwt", signedPayload || "");
            sessionStorage.removeItem("sf_params");
            sessionStorage.removeItem("shopifyShop");
            dispatchAuthStorageSync();
            setPendingJoinUserId(userId);
            router.replace(isOnboarded ? "/dashboard" : "/onboarding");
          }
          return;
        }

        // ── Shopify ──────────────────────────────────────────────────────
        if (shop) {
          try {
            let id_token: string | null = searchParams?.get("id_token") ?? null;
            const hasHmac = Boolean(searchParams?.get("hmac"));

            if (
              !id_token &&
              !hasHmac &&
              typeof window !== "undefined" &&
              window.shopify?.idToken
            ) {
              try {
                id_token = await Promise.race([
                  window.shopify.idToken(),
                  new Promise<null>((resolve) =>
                    setTimeout(() => resolve(null), 3000),
                  ),
                ]);
              } catch (tokenErr) {
                console.warn(
                  "Could not get App Bridge session token:",
                  tokenErr,
                );
              }
            }

            const allParams = Object.fromEntries(searchParams?.entries() ?? []);
            const params = id_token ? { ...allParams, id_token } : allParams;
            const res = await sfAuthLoadApi(params);
            const result = res;
            
            if (result.status) {
              const { userId, isOnboarded, agents, shopifyShop, token } = result;
              if (token) {
                setSocketToken("client", token);
              }
              sessionStorage.setItem("userId", userId);
              sessionStorage.setItem("agents", JSON.stringify(agents));
              sessionStorage.setItem("currentAgentId", agents[0]?._id ?? "");
              sessionStorage.setItem("provider", "shopify");
              sessionStorage.setItem("shopifyShop", shopifyShop || shop || "");
              sessionStorage.setItem("sf_params", searchParams?.toString() || "");
              sessionStorage.removeItem("signedPayloadJwt");
              sessionStorage.removeItem("bcStoreHash");
              sessionStorage.removeItem("bcStoreUrl");
              dispatchAuthStorageSync();
              setPendingJoinUserId(userId);
              router.replace(isOnboarded ? "/dashboard" : "/onboarding");
              return;
            }

            const httpStatus = getHttpStatusFromLoadResult(result);
            if (
              httpStatus === 400 ||
              httpStatus === 401 ||
              httpStatus === 403 ||
              result.status === false
            ) {
              const installUrl = new URL(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/shopify/auth/install`,
              );
              installUrl.searchParams.set("shop", shop);
              if (host) installUrl.searchParams.set("host", host);
              redirectToInstall(installUrl.toString());
              return;
            }

            setError(
              String(result.message || "Shopify authentication failed"),
            );
          } catch (shopifyErr) {
            setError(getErrorMessage(shopifyErr));
          }
          return;
        }

        setError(
          "Authentication Failed."
        );
      } catch (e) {
        setError(getErrorMessage(e));
      }
    };

    verifyAndRedirect();
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Loading your app...</p>
      </div>
    </div>
  );
}

export default function LoadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <LoadPageContent />
    </Suspense>
  );
}