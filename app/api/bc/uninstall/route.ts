import { NextResponse } from "next/server";

export async function POST() {
  // BigCommerce app/uninstalled webhook target
  // Clean up store records in your DB here.
  return NextResponse.json({ ok: true });
}


