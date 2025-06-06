// app/agent-inbox/_components/agent-layout.tsx
"use client";

import AgentSidebar from "./agent-sidebar";

interface AgentLayoutProps {
  children: React.ReactNode;
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <AgentSidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}