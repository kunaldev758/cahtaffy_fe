"use client";
import { MessageCircle } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex h-screen w-full bg-gray-50 items-center justify-center">
      <div className="text-center">
        <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Conversations</h2>
        <p className="text-gray-600">No conversations found. New conversations will appear here.</p>
      </div>
    </div>
  );
}