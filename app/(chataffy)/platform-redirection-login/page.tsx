import type { Metadata } from "next";
import { Suspense } from "react";
import { PlatformRedirectionLoginClient } from "./_components/PlatformRedirectionLoginClient";

export const metadata: Metadata = {
  title: "Platform Redirection Login",
};

export default function PlatformRedirectionLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <p className="text-gray-600">Signing you in...</p>
        </div>
      }
    >
      <PlatformRedirectionLoginClient />
    </Suspense>
  );
}
