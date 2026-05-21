"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { directClientLoginApi } from "../../../_api/login/action";
import { dispatchAuthStorageSync } from "../../../socketContext";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export function PlatformRedirectionLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ userId?: string | string[] }>();

  useEffect(() => {
    const run = async () => {
      const routeUserId = Array.isArray(params?.userId)
        ? params.userId[0]
        : params?.userId;
      const queryUserId = searchParams.get("userId");
      const userId = routeUserId || queryUserId;

      if (!userId) {
        router.replace(`${appUrl}login`);
        return;
      }

      try {
        const result = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/platform-redirection-login/${userId}`,{
          credentials: 'include',
        });
        const data = await result.json();
        if (data?.status_code !== 200 || !data?.token) {
          router.replace(`${appUrl}login`);
          return;
        }

        localStorage.setItem("token", data.token);
        if (data.userId != null) {
          localStorage.setItem("userId", String(data.userId));
        }
        if (Array.isArray(data.agents) && data.agents.length > 0) {
          localStorage.setItem("agents", JSON.stringify(data.agents));
          localStorage.setItem(
            "currentAgentId",
            data.agents[0]?._id != null ? String(data.agents[0]._id) : ""
          );
        }

        dispatchAuthStorageSync();

        if (data.isOnboarded === false) {
          router.replace(`${appUrl}onboarding`);
        } else {
          router.replace(`${appUrl}dashboard`);
        }
      } catch (error) {
        console.error("Platform redirection login failed:", error);
        router.replace(`${appUrl}login`);
      }
    };

    void run();
  }, [params, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <p className="text-gray-600">Signing you in...</p>
    </div>
  );
}
