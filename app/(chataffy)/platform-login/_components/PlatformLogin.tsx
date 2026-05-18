"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { dispatchAuthStorageSync, useSocket } from "../../../socketContext";
import { toast } from "react-toastify";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export function PlatformLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ userId?: string | string[] }>();
  const { socket } = useSocket();

  const handleSocketEvent = (userId: any) => {
    if (socket) {
      socket.on("user-logged-in", () => {
        socket.emit("join", userId);
      });
    }
  };

  useEffect(() => {
    const run = async () => {
      const routeUserId = Array.isArray(params?.userId)
        ? params.userId[0]
        : params?.userId;
      const queryUserId = searchParams.get("userId");
      const userId = routeUserId || queryUserId;

      if (!userId) {
        toast.error("User ID not found");
        router.replace(`${appUrl}login`);
        return;
      }

      try {
        // const result = await platformLoginApi(clientId);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/platform-redirection-login/${userId}`,{
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        })
          const result = await response.json()
        console.log(result, "<---result platform login");
        if (result?.status_code !== 200 || !result?.userId) {
          router.replace(`${appUrl}login`);
          return;
        }

        if(!result.userId){
            toast.error("User not found");
        }
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
        handleSocketEvent(result.userId);

        if (result.isOnboarded === false) {
          router.replace(`${appUrl}onboarding`);
        } else {
          router.replace(`${appUrl}dashboard`);
        }
      } catch (error) {
        console.error("Platform login failed:", error);
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
