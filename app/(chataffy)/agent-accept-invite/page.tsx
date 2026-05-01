import { Suspense } from "react";
import AgentAcceptInviteContent from "./AgentAcceptInviteContent";

export default function AgentAcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AgentAcceptInviteContent />
    </Suspense>
  );
}
