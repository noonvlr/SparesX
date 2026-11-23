"use client";

import { useEffect, useState } from "react";
import { AdminPage } from "@/components/layout";
import { Alert } from "@/components/ui/Alert";
import { AdminNavDirectory } from "@/components/admin/AdminNav";
import { AdminPageHeader } from "@/components/admin/AdminPageChrome";
import { authFetch, getCachedRole } from "@/lib/auth/clientAuth";

export default function AdminSettingsPage() {
  const [supportUnread, setSupportUnread] = useState(0);

  useEffect(() => {
    if (getCachedRole() && getCachedRole() !== "admin") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/admin/support/unread-count");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.unreadCount === "number") {
          setSupportUnread(data.unreadCount);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminPage>
      <AdminPageHeader
        title="All tools"
        description="Full directory of admin pages, grouped by job. Matches the sidebar and mobile drawer."
      />

      <AdminNavDirectory supportUnread={supportUnread} />

      <div className="mt-10">
        <Alert tone="warning" title="Chat access policy">
          Chat dispute tools are for conflict review and safety only. Prefer
          support tickets for normal user issues, and only open private chats
          when a dispute requires evidence. See the{" "}
          <a href="/admin/disputes" className="underline font-semibold">
            Dispute SOP
          </a>
          .
        </Alert>
      </div>
    </AdminPage>
  );
}
