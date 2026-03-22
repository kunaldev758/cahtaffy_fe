"use client";

import { useEffect } from "react";
import { clearAuthLocalStorage } from "@/lib/clear-auth-local-storage";

/** Server passes cookie state; only the client can touch localStorage. */
export function ClearAuthLocalStorageIfNoToken({ hasToken }: { hasToken: boolean }) {
  useEffect(() => {
    if (!hasToken) {
      clearAuthLocalStorage();
    }
  }, [hasToken]);

  return null;
}
