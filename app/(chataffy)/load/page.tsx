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

const GENERIC_LOAD_ERROR =
  "Something went wrong while loading the app. Please try again.";

/** How long the page may spin before we give up and show an error. */
const LOAD_TIMEOUT_MS = 25000;

type LoadFailure = {
  code: string;
  message: string;
  shop?: string;
  authorizeUrl?: string;
};

/** Failures where re-installing the app is the fix. */
const INSTALL_CODES = new Set(["NOT_INSTALLED", "TOKEN_REVOKED"]);
/** Transient failures where simply reloading may fix it. */
const RELOAD_CODES = new Set([
  "SESSION_EXPIRED",
  "SESSION_INVALID",
  "EXCHANGE_FAILED",
  "SERVER_UNREACHABLE",
  "LOAD_FAILED",
  "LOAD_TIMEOUT",
  "UNKNOWN",
]);

const FAILURE_TITLES: Record<string, string> = {
  APP_CREDENTIAL_MISMATCH: "Shopify app credentials are invalid",
  SESSION_EXPIRED: "Session expired",
  SESSION_INVALID: "Session invalid",
  NOT_INSTALLED: "App not installed",
  TOKEN_REVOKED: "Shopify access revoked",
  EXCHANGE_FAILED: "Could not connect your store",
  INVALID_REQUEST: "Invalid link",
  USER_NOT_FOUND: "Account not found",
  SERVER_UNREACHABLE: "Cannot reach the server",
  LOAD_TIMEOUT: "Taking too long",
  LOAD_FAILED: "Something went wrong",
  SHOPIFY_NOT_CONFIGURED: "Shopify is not configured",
};

function isSafeShopifyAuthorizeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (
      parsed.hostname.endsWith(".myshopify.com") &&
      parsed.pathname === "/admin/oauth/authorize"
    ) {
      return true;
    }
    return (
      parsed.hostname === "admin.shopify.com" &&
      /^\/store\/[^/]+\/oauth\/authorize$/.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

/** Leave the app iframe so Shopify can render its own oauth error page. */
function escapeIframeToShopifyError(url: string) {
  if (window.self === window.top) {
    window.location.replace(url);
    return;
  }
  try {
    window.open(url, "_top");
  } catch {
    // App Bridge / browser may still allow top.location.
  }
  try {
    window.top!.location.replace(url);
  } catch {
    // Cross-origin admin frame can block this; App Bridge open() is the path.
  }
}

/**
 * Turn an /auth/load result into a user-safe failure. Prefers the backend's
 * stable `code`; falls back to the HTTP status for older responses.
 */
function resolveLoadFailure(result: unknown, shop?: string | null): LoadFailure {
  const r = (result && typeof result === "object" ? result : {}) as {
    code?: unknown;
    message?: unknown;
    shop?: unknown;
    authorizeUrl?: unknown;
  };
  const httpStatus = getHttpStatusFromLoadResult(result);
  const rawMessage = typeof r.message === "string" ? r.message : "";
  const authorizeUrl =
    typeof r.authorizeUrl === "string" && isSafeShopifyAuthorizeUrl(r.authorizeUrl)
      ? r.authorizeUrl
      : undefined;

  let code = typeof r.code === "string" && r.code ? r.code : "";
  if (!code) {
    if (httpStatus === 401) code = "SESSION_EXPIRED";
    else if (httpStatus === 403) {
      code = /application_cannot_be_found|credential/i.test(rawMessage)
        ? "APP_CREDENTIAL_MISMATCH"
        : "NOT_INSTALLED";
    } else if (httpStatus === 400) code = "INVALID_REQUEST";
    else if (httpStatus === 0) code = "SERVER_UNREACHABLE";
    else code = "UNKNOWN";
  }

  return {
    code,
    message: rawMessage || GENERIC_LOAD_ERROR,
    shop: (typeof r.shop === "string" && r.shop) || shop || undefined,
    authorizeUrl,
  };
}

function buildInstallUrl(shop: string, host?: string | null): string {
  const installUrl = new URL(
    `${process.env.NEXT_PUBLIC_API_HOST}/api/shopify/auth/install`,
  );
  installUrl.searchParams.set("shop", shop);
  if (host) installUrl.searchParams.set("host", host);
  return installUrl.toString();
}

function LoadErrorScreen({
  failure,
  host,
}: {
  failure: LoadFailure;
  host: string | null;
}) {
  const showInstall = INSTALL_CODES.has(failure.code) && !!failure.shop;
  const showReload = RELOAD_CODES.has(failure.code);

  // Runs inside a click handler, so the browser treats the top-level
  // navigation as user-initiated (auto redirects from an iframe are blocked).
  const handleInstall = () => {
    if (!failure.shop) return;
    const url = buildInstallUrl(failure.shop, host);
    if (window.self !== window.top) {
      window.open(url, "_top");
    } else {
      window.location.href = url;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-3">
          {FAILURE_TITLES[failure.code] || "Unable to load the app"}
        </h1>
        <p className="text-gray-700 mb-6">{failure.message}</p>

        <div className="flex items-center justify-center gap-3">
          {showInstall && (
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Install / Reconnect
            </button>
          )}
          {showReload && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              Reload
            </button>
          )}
        </div>
      </div>
    </div>
  );
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
  const [failure, setFailure] = useState<LoadFailure | null>(null);
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
     // 👇 New tab — do NOT redirect to Shopify
    // return false;
  }

  useEffect(() => {
    // Set once we have navigated away or shown an error; stops the timeout.
    let settled = false;
    const fail = (f: LoadFailure) => {
      settled = true;
      setFailure(f);
    };
    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        fail({
          code: "LOAD_TIMEOUT",
          message: "Loading is taking too long. Please reload the page.",
          shop: searchParams?.get("shop") || undefined,
        });
      }
    }, LOAD_TIMEOUT_MS);

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
          console.log(res, "this is the response bigcommerce!");
          const result = res;
          if (result.status) {
            const { userId, isOnboarded, agents, bigcommerceStoreHash, bigcommerceStoreUrl, token } =
              result;
            if (token) {
              setSocketToken("client", token);
            }
            sessionStorage.setItem("role", "client");
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
            settled = true;
            router.replace(isOnboarded ? "/dashboard" : "/onboarding");
          } else {
            fail(resolveLoadFailure(result));
          }
          return;
        }

        // ── Shopify ──────────────────────────────────────────────────────
        if (shop) {
          try {
            // A different store than the one this tab last used: drop the old
            // store's session state so its agents/shop can never leak into this one.
            const previousShop = sessionStorage.getItem("shopifyShop");
            if (previousShop && previousShop !== shop) {
              [
                "userId",
                "agents",
                "currentAgentId",
                "provider",
                "shopifyShop",
                "sf_params",
                "role",
              ].forEach((key) => sessionStorage.removeItem(key));
            }

            // Get session token from new App Bridge via window.shopify
            let id_token: string | null = searchParams?.get("id_token") ?? null;

            if (typeof window !== "undefined" && window.shopify?.idToken) {
              try {
                id_token = await window.shopify.idToken();
              } catch (tokenErr) {
                console.warn(
                  "Could not get App Bridge session token:",
                  tokenErr,
                );
              }
            }

            // Build params — prefer id_token, fallback to install_token etc.
            const allParams = Object.fromEntries(searchParams?.entries() ?? []);

            console.log("all params :",allParams)
            // const params = id_token
            //   ? { shop, host, id_token } // App Bridge flow (normal load)
            //   : allParams; // Post-install flow (install_token)
            // The URL's id_token expires after ~1 minute; send the fresh App
            // Bridge token when we have one.
            const params = id_token ? { ...allParams, id_token } : allParams;

            // const res = await axios.get(`${apiBase}/api/shopify/auth/load`, {
            //   params,
            //   withCredentials: true,
            // });
            const res = await sfAuthLoadApi(params);
            const result = res;

            console.log("res check : ",res);
            if (result.status) {
              const { userId, isOnboarded, agents, shopifyShop, token } = result;
              if (token) {
                setSocketToken("client", token);
              }
              sessionStorage.setItem("role", "client");
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
              settled = true;
              router.replace(isOnboarded ? "/dashboard" : "/onboarding");
              return;
            }

            const loadFailure = resolveLoadFailure(result, shop);
            console.log("load failure :", loadFailure.code);

            // Wrong credentials: do not load the app. Leave the iframe and
            // open Shopify's own application_cannot_be_found page. The
            // authorize client_id is not our live app id, so nothing installs.
            if (loadFailure.code === "APP_CREDENTIAL_MISMATCH") {
              settled = true;
              if (loadFailure.authorizeUrl) {
                escapeIframeToShopifyError(loadFailure.authorizeUrl);
              }
              if (shop && window.self !== window.top) {
                const exitUrl = `${process.env.NEXT_PUBLIC_API_HOST}/api/shopify/auth/credential-error?shop=${encodeURIComponent(shop)}`;
                window.setTimeout(() => {
                  window.location.replace(exitUrl);
                }, 250);
              }
              if (!loadFailure.authorizeUrl && !(shop && window.self !== window.top)) {
                fail(loadFailure);
              }
              return;
            }

            // Legacy install links open the app at the top level: continue the
            // OAuth install automatically there. Inside the Shopify iframe the
            // browser blocks unprompted top-level navigation, so the user gets
            // an "Install / Reconnect" button instead (a click is a user gesture).
            if (
              INSTALL_CODES.has(loadFailure.code) &&
              window.self === window.top
            ) {
              settled = true;
              redirectToInstall(buildInstallUrl(shop, host));
              return;
            }

            fail(loadFailure);
          } catch (shopifyErr) {
            console.error("[load] Shopify load failed:", shopifyErr);
            fail({ code: "UNKNOWN", message: GENERIC_LOAD_ERROR, shop });
          }
          return;
        }

        fail({
          code: "INVALID_REQUEST",
          message:
            "Invalid link. Please open the app again from your Shopify admin.",
        });
      } catch (e) {
        console.error("[load] Load failed:", e);
        fail({ code: "UNKNOWN", message: GENERIC_LOAD_ERROR });
      }
    };

    verifyAndRedirect();

    return () => window.clearTimeout(timeoutId);
  }, [searchParams]);

  if (failure) {
    return (
      <LoadErrorScreen failure={failure} host={searchParams?.get("host") ?? null} />
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