import type { Metadata } from "next";
import { Suspense } from "react";
import { PlatformLogin } from "./_components/PlatformLogin";

export const metadata: Metadata = {
  title: "Platform Login",
};

export default function PlatformLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <p className="text-gray-600">Signing you in...</p>
        </div>
      }
    >
      <PlatformLogin />
    </Suspense>
  );
}
