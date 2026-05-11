"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { directClientLoginApi } from "../../../_api/login/action";
import { dispatchAuthStorageSync } from "../../../socketContext";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export function DirectClientLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ token?: string | string[] }>();

  useEffect(() => {
    const run = async () => {
      const routeToken = Array.isArray(params?.token)
        ? params.token[0]
        : params?.token;
      const queryToken = searchParams.get("token");
      const token = routeToken || queryToken;

      if (!token) {
        router.replace(`${appUrl}login`);
        return;
      }

      try {
        const result = await directClientLoginApi(token);

        if (result?.status_code !== 200 || !result?.token) {
          router.replace(`${appUrl}login`);
          return;
        }

        localStorage.setItem("token", result.token);
        if (result.userId != null) {
          localStorage.setItem("userId", String(result.userId));
        }
        if (Array.isArray(result.agents) && result.agents.length > 0) {
          localStorage.setItem("agents", JSON.stringify(result.agents));
          localStorage.setItem(
            "currentAgentId",
            result.agents[0]?._id != null ? String(result.agents[0]._id) : ""
          );
        }

        dispatchAuthStorageSync();

        if (result.isOnboarded === false) {
          router.replace(`${appUrl}onboarding`);
        } else {
          router.replace(`${appUrl}dashboard`);
        }
      } catch (error) {
        console.error("Direct client login failed:", error);
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
