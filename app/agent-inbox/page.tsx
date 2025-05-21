import dynamic from "next/dynamic";
const Inbox = dynamic(() => import("../(chataffy)/(dashboard)/inbox/_components/inbox"), { ssr: false });

export default function AgentInboxPage() {
  // Add auth check here if needed
  return <Inbox />;
}