"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { setClientSessionCookies } from "../../../_api/login/action";

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

      await setClientSessionCookies(token);
      localStorage.setItem("token", token);
      router.replace(`${appUrl}dashboard`);
    };

    void run();
  }, [params, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <p className="text-gray-600">Signing you in...</p>
    </div>
  );
}
