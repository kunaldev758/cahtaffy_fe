"use client";
import { MessageCircle } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="bg-white border-l border-gray-200 flex flex-col rounded-[20px] flex-1 justify-center items-center">
      <div className="text-center">
        <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Conversations</h2>
        <p className="text-gray-600">No conversations found. New conversations will appear here.</p>
      </div>
    </div>
  );
}