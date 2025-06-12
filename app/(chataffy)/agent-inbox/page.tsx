import dynamic from "next/dynamic";
import AgentLayout from "./_components/agent-layout";
const Inbox = dynamic(() => import("../(dashboard)/inbox/_components/inbox"), { ssr: false });

export default function AgentInboxPage() {
  // Add auth check here if needed
   return (
    <AgentLayout>
      <Inbox />
    </AgentLayout>
  );
}