"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  unreadCount: number;
  href: string;
  className?: string;
}

/**
 * أيقونة الجرس مع شارة العدد غير المقروء — تُستخدم في هيدر لوحتي الباحث والجهة.
 * جلب العدد الفعلي (عبر GET /api/notifications?unread=true) يحدث في المكوّن الأب
 * الذي يستخدم هذا العنصر، حفاظًا على بساطة هذا المكوّن (عرض فقط، بلا استعلام).
 */
export function NotificationBell({ unreadCount, href, className }: NotificationBellProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors duration-fast hover:bg-neutral-100",
        className
      )}
      aria-label={`الإشعارات${unreadCount > 0 ? ` (${unreadCount} غير مقروءة)` : ""}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span
          className="absolute end-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-on-primary"
          aria-hidden="true"
        >
          {unreadCount > 9 ? "٩+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
