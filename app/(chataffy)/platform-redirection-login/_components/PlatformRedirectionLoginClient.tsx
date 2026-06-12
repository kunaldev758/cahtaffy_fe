"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { directClientLoginApi, platformRedirectionLogin } from "../../../_api/login/action";
import { dispatchAuthStorageSync } from "../../../socketContext";
import { setSocketToken } from "@/lib/socketSession";

const appUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || process.env.NEXT_PUBLIC_APP_URL || '/';

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
      const token = searchParams.get("token");
      const userId = routeUserId || queryUserId;

      if (!userId || !token) {
        router.replace(`${appUrl}login`);
        return;
      }

      try {
        // const result = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/platform-redirection-login/${userId}`,{
        //   credentials: 'include',
        // });
        // const data = await result.json();
        const result = await platformRedirectionLogin(userId, token);
        const data = result;
        if (data?.status_code !== 200 || !data?.token) {
          router.replace(`${appUrl}login`);
          return;
        }


        console.log("palform based redirection data : ", data)

        sessionStorage.setItem("token", data.token);
        // also persist token where the socket provider expects it
        if (data.token) setSocketToken("client", data.token);
        if (data.userId != null) {
          sessionStorage.setItem("userId", String(data.userId));
        }
        if (Array.isArray(data.agents) && data.agents.length > 0) {
          sessionStorage.setItem("agents", JSON.stringify(data.agents));
          sessionStorage.setItem(
            "currentAgentId",
            data.agents[0]?._id != null ? String(data.agents[0]._id) : ""
          );
        }

        // store new human agent  id ---> 
        if (data?.humanAgentId) {

          sessionStorage.setItem('humanAgentId', data?.humanAgentId);
        }

        // console.log("calling dispatchAuthStorageSync from redirection")
        await new Promise((resolve) => requestAnimationFrame(resolve));
        // setTimeout(() => {
        dispatchAuthStorageSync();
        if (data.isOnboarded === false) {
          router.replace(`${appUrl}onboarding`);
        } else {
          router.replace(`${appUrl}dashboard`);
        }
        // }, 1000)

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
