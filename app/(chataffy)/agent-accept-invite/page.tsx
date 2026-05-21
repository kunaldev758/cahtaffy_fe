import { Suspense } from "react";
import AgentAcceptInviteContent from "./AgentAcceptInviteContent";

export default function AgentAcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <AgentAcceptInviteContent />
    </Suspense>
  );
}
