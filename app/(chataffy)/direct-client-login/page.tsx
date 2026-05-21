import type { Metadata } from "next";
import { Suspense } from "react";
import { DirectClientLoginClient } from "./_components/DirectClientLoginClient";

export const metadata: Metadata = {
  title: "Direct Client Login",
};

export default function DirectClientLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <p className="text-gray-600">Signing you in...</p>
        </div>
      }
    >
      <DirectClientLoginClient />
    </Suspense>
  );
}
