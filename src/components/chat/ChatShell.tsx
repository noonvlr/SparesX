"use client";

import { usePathname } from "next/navigation";
import ChatProvider from "@/components/chat/ChatProvider";
import FloatingChatDock from "@/components/chat/FloatingChatDock";
import { isAdminPath } from "@/lib/admin/nav";

/** Global chat shell: socket, floating dock, sound, deep-links. */
export default function ChatShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const hideDock = isAdminPath(pathname);

  return (
    <ChatProvider>
      {children}
      {!hideDock ? <FloatingChatDock /> : null}
    </ChatProvider>
  );
}
