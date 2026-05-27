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

export async function POST() {
  const response = NextResponse.json({ status: true });
  const opts = serverAuthCookieOpts();

  for (const name of AUTH_COOKIE_NAMES) {
    response.cookies.set(name, "", { ...opts, maxAge: 0, sameSite: "none" as "none" | "lax" | "strict", secure: true });
  }

  return response;
}
