import { Suspense } from "react";
import AgentLayout from "./_components/agent-layout";
import Inbox from "../(dashboard)/inbox/_components/inbox";
import InboxSkeleton from "../(dashboard)/inbox/_components/InboxSkeleton";

export default function AgentInboxPage() {
  return (
    <AgentLayout>
      <Suspense fallback={<InboxSkeleton />}>
        <Inbox />
      </Suspense>
    </AgentLayout>
  );
}
