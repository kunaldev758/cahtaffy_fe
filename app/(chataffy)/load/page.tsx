"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { dispatchAuthStorageSync, useSocket } from "../../socketContext";
import axios from "axios";

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

  useEffect(() => {
    const verifyAndRedirect = async () => {
      const signedPayload = searchParams?.get("signed_payload_jwt");
      if (!signedPayload) {
        setError(
          "Missing authentication information. Please access the app via your BigCommerce Apps panel or refresh the page.",
        );
        return;
      }

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/bigcommerce/auth/load`,
        {
          params: { signed_payload_jwt: signedPayload },
          withCredentials: true,
        },
      );
      const result = res.data;
      if (result.status) {
        const { userId, isOnboarded, agents, bigcommerceStoreHash } = result;
        localStorage.setItem("userId", userId);
        localStorage.setItem("agents", JSON.stringify(agents));
        localStorage.setItem("currentAgentId", agents[0]?._id ?? "");
        localStorage.setItem("provider", "bigcommerce");
        localStorage.setItem("bcStoreHash", bigcommerceStoreHash || "");
        localStorage.setItem("signedPayloadJwt", signedPayload || "");

        dispatchAuthStorageSync();
        handleSocketEvent(result.userId);
        if (isOnboarded) {
          router.replace(`/dashboard`);
        } else {
          router.replace(`/onboarding`);
        }
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
