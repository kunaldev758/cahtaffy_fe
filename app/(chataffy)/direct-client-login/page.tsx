import type { Metadata } from "next";
import { DirectClientLoginClient } from "./_components/DirectClientLoginClient";

export const metadata: Metadata = {
  title: "Direct Client Login",
};

export default function DirectClientLoginPage() {
  return <DirectClientLoginClient />;
}
