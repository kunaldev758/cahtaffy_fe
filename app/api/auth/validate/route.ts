import { NextRequest, NextResponse } from "next/server";
import { AGENT_TOKEN, CLIENT_TOKEN, LEGACY_TOKEN } from "@/lib/authCookies";

type Portal = "client" | "agent";

function resolveBackendUrl(path: string) {
  const rawBase = process.env.API_HOST || process.env.NEXT_PUBLIC_API_HOST;
  if (!rawBase) return null;

  const base = rawBase.replace(/\/+$/, "");
  return base.endsWith("/api") ? `${base}/${path}` : `${base}/api/${path}`;
}

function selectToken(request: NextRequest, portal: Portal) {
  if (portal === "agent") {
    return (
      request.cookies.get(AGENT_TOKEN)?.value ||
      request.cookies.get(LEGACY_TOKEN)?.value ||
      null
    );
  }

  const platform = request.cookies.get("platform")?.value || "local";
  if (platform === "shopify") return request.cookies.get("sf_token")?.value || null;
  if (platform === "bigcommerce") return request.cookies.get("bc_token")?.value || null;

  return (
    request.cookies.get(CLIENT_TOKEN)?.value ||
    request.cookies.get(LEGACY_TOKEN)?.value ||
    null
  );
}

function normalizePortal(value: string | null): Portal {
  return value === "agent" ? "agent" : "client";
}

export async function GET(request: NextRequest) {
  const portal = normalizePortal(request.nextUrl.searchParams.get("portal"));
  const token = selectToken(request, portal);

  if (!token) {
    return NextResponse.json(
      { valid: false, message: "Token is required" },
      { status: 401 },
    );
  }

  const validateUrl = resolveBackendUrl("validate-token");
  if (!validateUrl) {
    return NextResponse.json(
      { valid: false, message: "API host is not configured" },
      { status: 500 },
    );
  }

  const response = await fetch(validateUrl, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ portal }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(
      { valid: false, message: data?.message || "Invalid token" },
      { status: response.status },
    );
  }

  const agent = data.agent || data.humanAgent || null;
  const role: Portal =
    data.role === "agent" || data.role === "human-agent" || agent
      ? "agent"
      : "client";
  const currentAgentId =
    data.currentAgentId ||
    (role === "agent" ? agent?.assignedAgents?.[0] : data.agents?.[0]?._id) ||
    "";

  return NextResponse.json({
    ...data,
    valid: true,
    role,
    agent,
    humanAgentId: data.humanAgentId || agent?.id || agent?._id || "",
    currentAgentId,
  });
}
