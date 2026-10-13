import { NextResponse } from "next/server";
import {
  AGENT_TOKEN,
  CLIENT_TOKEN,
  LEGACY_TOKEN,
  serverAuthCookieOpts,
} from "@/lib/authCookies";

const AUTH_COOKIE_NAMES = [
  CLIENT_TOKEN,
  AGENT_TOKEN,
  LEGACY_TOKEN,
  "platform",
  "role",
  "sf_token",
  "bc_token",
] as const;

const PARTITIONED_COOKIE_NAMES = ["platform", "sf_token", "bc_token"] as const;

export async function POST() {
  const response = NextResponse.json({ status: true });
  const opts = serverAuthCookieOpts();

  for (const name of AUTH_COOKIE_NAMES) {
    response.cookies.set(name, "", { ...opts, maxAge: 0, sameSite: "none" as "none" | "lax" | "strict", secure: true });
  }

  // Embedded Shopify/BigCommerce cookies are Partitioned; a partitioned cookie is a
  // different cookie from its unpartitioned twin, so it must be expired explicitly.
  const domainAttr = opts.domain ? `; Domain=${opts.domain}` : "";
  for (const name of PARTITIONED_COOKIE_NAMES) {
    response.headers.append(
      "Set-Cookie",
      `${name}=; Max-Age=0; Path=/${domainAttr}; Secure; SameSite=None; Partitioned`,
    );
  }

  return response;
}
