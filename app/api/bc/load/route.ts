import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("signed_payload_jwt");

  if (!token) {
    return NextResponse.json({ error: "Missing signed_payload_jwt" }, { status: 400 });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.BC_CLIENT_SECRET as string);
    // decoded contains context like "stores/{store_hash}" and user info
    const storeHash = (decoded?.context || "").toString().split("/")[1] || decoded?.store_hash;

    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/(chataffy)/(dashboard)/dashboard`);
    if (storeHash) {
      response.cookies.set("bc_store_hash", storeHash, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/",
      });
    }
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invalid token" }, { status: 400 });
  }
}


