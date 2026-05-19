"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { dispatchAuthStorageSync, useSocket } from "../../socketContext";
import axios from "axios";

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

  const handleSocketEvent = (userId: any) => {
    if (socket) {
      socket.on("user-logged-in", () => {
        socket.emit("join", userId);
      });
    }
  };

  function redirectToInstall(url: string) {
    if (typeof window === "undefined") return;
    const embedded = window.self !== window.top;
    if (embedded) {
      queueMicrotask(() => {
        window.open(url, "_top");
      });
      return;
    }
    // window.location.href = url;
     // 👇 New tab — do NOT redirect to Shopify
    return false;
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
          const res = await axios.get(`${apiBase}/api/bigcommerce/auth/load`, {
            params: { signed_payload_jwt: signedPayload },
            withCredentials: true,
          });
          const result = res.data;
          if (result.status) {
            const { userId, isOnboarded, agents, bigcommerceStoreHash } =
              result;
            localStorage.setItem("userId", userId);
            localStorage.setItem("agents", JSON.stringify(agents));
            localStorage.setItem("currentAgentId", agents[0]?._id ?? "");
            localStorage.setItem("provider", "bigcommerce");
            localStorage.setItem("bcStoreHash", bigcommerceStoreHash || "");
            localStorage.setItem("signedPayloadJwt", signedPayload || "");
            localStorage.removeItem("logoutPlatform");
            localStorage.removeItem("id_token");
            localStorage.removeItem("shopifyShop");
            dispatchAuthStorageSync();
            handleSocketEvent(result.userId);
            router.replace(isOnboarded ? "/dashboard" : "/onboarding");
          }
          return;
        }

        // ── Shopify ──────────────────────────────────────────────────────
        if (shop) {
          try {
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
            const params = id_token
              ? { shop, host, id_token } // App Bridge flow (normal load)
              : allParams; // Post-install flow (install_token)

            const res = await axios.get(`${apiBase}/api/shopify/auth/load`, {
              params,
              withCredentials: true,
            });

            const result = res.data;
            if (result.status) {
              const { userId, isOnboarded, agents, shopifyShop } = result;
              localStorage.setItem("userId", userId);
              localStorage.setItem("agents", JSON.stringify(agents));
              localStorage.setItem("currentAgentId", agents[0]?._id ?? "");
              localStorage.setItem("provider", "shopify");
              localStorage.setItem("shopifyShop", shopifyShop || shop || "");
              localStorage.setItem("id_token", id_token || "");
              localStorage.removeItem("logoutPlatform");
              localStorage.removeItem("signedPayloadJwt");
              localStorage.removeItem("bcStoreHash");
              dispatchAuthStorageSync();
              handleSocketEvent(result.userId);
              router.replace(isOnboarded ? "/dashboard" : "/onboarding");
            }
          } catch (shopifyErr) {
            if (axios.isAxiosError(shopifyErr)) {
              const status = shopifyErr.response?.status;

              // Not installed or uninstalled → trigger OAuth
              if (status === 400 || status === 401 || status === 403) {
                if (shop) {
                  const installUrl = new URL(
                    `${process.env.NEXT_PUBLIC_API_HOST}/api/shopify/auth/install`
                  );
                  installUrl.searchParams.set("shop", shop);
                  if (host) installUrl.searchParams.set("host", host);
          
                  redirectToInstall(installUrl.toString());
                  return;
                }
              }
            }
            throw shopifyErr;
          }
          return;
        }

        setError(
          "Authentication Failed."
        );
      } catch (e) {
        const message = axios.isAxiosError(e)
          ? String(
              e.response?.data?.message || e.response?.data?.error || e.message,
            )
          : e instanceof Error
            ? e.message
            : "Authentication failed";
        setError(String(message || "Authentication failed"));
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


