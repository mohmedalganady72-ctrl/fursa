"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LogoutButton } from "@/components/shared/logout-button";

export function DashboardHeader({ basePath, initialNotifications, initialMessages }: {
  basePath: "/applicant" | "/organization";
  initialNotifications: number;
  initialMessages: number;
}) {
  const [counts, setCounts] = React.useState({ notifications: initialNotifications, messages: initialMessages });
  const isRefreshing = React.useRef(false);
  const lastRefreshAt = React.useRef(0);

  React.useEffect(() => {
    const refresh = async () => {
      if (isRefreshing.current || document.visibilityState === "hidden" || Date.now() - lastRefreshAt.current < 30_000) return;
      isRefreshing.current = true;
      lastRefreshAt.current = Date.now();
      try {
        const response = await fetch("/api/navigation-counts", { cache: "no-store" });
        if (response.status === 403) {
          const result = await response.json().catch(() => ({}));
          if (result.error === "ACCOUNT_RESTRICTED") window.location.replace("/account-restricted");
          return;
        }
        if (response.ok) setCounts((await response.json()).data);
      } finally {
        isRefreshing.current = false;
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return (
    <div className="mb-5 flex h-10 items-center justify-end gap-1">
      <ThemeToggle />
      <LogoutButton />
      <Link href={`${basePath}/messages`} aria-label={`الرسائل${counts.messages ? ` (${counts.messages} غير مقروءة)` : ""}`} className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100">
        <MessageCircle className="h-5 w-5" />
        {counts.messages > 0 && <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[9px] font-semibold text-white">{counts.messages > 9 ? "9+" : counts.messages}</span>}
      </Link>
      <NotificationBell unreadCount={counts.notifications} href={`${basePath}/notifications`} />
    </div>
  );
}
