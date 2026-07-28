"use client";

import ChatProvider from "@/components/chat/ChatProvider";
import FloatingChatDock from "@/components/chat/FloatingChatDock";

/** Global chat shell: socket, floating dock, sound, deep-links. */
export default function ChatShell({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      {children}
      <FloatingChatDock />
    </ChatProvider>
  );
}
