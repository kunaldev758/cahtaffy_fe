import { NextRequest, NextResponse } from "next/server";
import {
  AGENT_TOKEN,
  getClientAuthTokenCandidates,
  LEGACY_TOKEN,
} from "@/lib/authCookies";

type Portal = "client" | "agent";

function resolveBackendUrl(path: string) {
  const rawBase = process.env.API_HOST || process.env.NEXT_PUBLIC_API_HOST;
  if (!rawBase) return null;

  const base = rawBase.replace(/\/+$/, "");
  return base.endsWith("/api") ? `${base}/${path}` : `${base}/api/${path}`;
}

function selectAgentToken(request: NextRequest): string | null {
  return (
    request.cookies.get(AGENT_TOKEN)?.value ||
    request.cookies.get(LEGACY_TOKEN)?.value ||
    null
  );
}

function normalizePortal(value: string | null): Portal {
  return value === "agent" ? "agent" : "client";
}

async function validateTokenWithBackend(
  token: string,
  portal: Portal,
  validateUrl: string,
) {
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
  return { ok: response.ok, data };
}

function buildValidResponse(data: Record<string, unknown>) {
  const agent =
    (data.agent as Record<string, unknown> | undefined) ||
    (data.humanAgent as Record<string, unknown> | undefined) ||
    null;
  const role: Portal =
    data.role === "agent" || data.role === "human-agent" || agent
      ? "agent"
      : "client";
  const currentAgentId =
    (data.currentAgentId as string) ||
    (role === "agent"
      ? (agent?.assignedAgents as unknown[])?.[0]
      : (data.agents as { _id?: string }[])?.[0]?._id) ||
    "";

  return NextResponse.json({
    ...data,
    valid: true,
    role,
    agent,
    humanAgentId:
      (data.humanAgentId as string) ||
      (agent?.id as string) ||
      (agent?._id as string) ||
      "",
    currentAgentId,
  });
}

export async function GET(request: NextRequest) {
  const portal = normalizePortal(request.nextUrl.searchParams.get("portal"));
  const validateUrl = resolveBackendUrl("validate-token");

  if (!validateUrl) {
    return NextResponse.json(
      { valid: false, message: "API host is not configured" },
      { status: 500 },
    );
  }

  const tokens =
    portal === "agent"
      ? [selectAgentToken(request)].filter((t): t is string => !!t)
      : getClientAuthTokenCandidates(request.cookies);

  if (!tokens.length) {
    return NextResponse.json(
      { valid: false, message: "Token is required" },
      { status: 401 },
    );
  }

  let lastMessage = "Invalid token";
  let lastStatus = 401;

  for (const token of tokens) {
    const { ok, data } = await validateTokenWithBackend(
      token,
      portal,
      validateUrl,
    );
    if (ok) {
      return buildValidResponse(data);
    }
    lastMessage = (data?.message as string) || lastMessage;
    lastStatus = typeof data?.status_code === "number" ? data.status_code : 401;
  }

  return NextResponse.json(
    { valid: false, message: lastMessage },
    { status: lastStatus },
  );
}
