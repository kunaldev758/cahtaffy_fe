import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const scope = url.searchParams.get("scope");
  const context = url.searchParams.get("context");

  if (!code || !context) {
    return NextResponse.json({ error: "Missing code or context" }, { status: 400 });
  }

  try {
    const resp = await fetch("https://login.bigcommerce.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.BC_CLIENT_ID,
        client_secret: process.env.BC_CLIENT_SECRET,
        code,
        scope,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/bc/install`,
        context,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json({ error: data?.error || "Token exchange failed" }, { status: 400 });
    }

    // NOTE: Persist data.access_token and data.context/store_hash server-side in your DB.
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}


