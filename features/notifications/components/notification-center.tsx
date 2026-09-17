"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, formatDateArabic } from "@/lib/utils";
import type { Notification } from "@/lib/db/schema";

export function NotificationCenter({ initialNotifications }: { initialNotifications: Notification[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialNotifications);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [isMarkingAll, setIsMarkingAll] = React.useState(false);
  const visible = filter === "unread" ? items.filter((item) => !item.isRead) : items;
  const unreadCount = items.filter((item) => !item.isRead).length;

  async function openNotification(notification: Notification) {
    if (!notification.isRead) {
      const response = await fetch(`/api/notifications/${notification.id}/read`, { method: "PATCH" });
      if (response.ok) setItems((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
    }
    if (notification.linkUrl) router.push(notification.linkUrl);
    router.refresh();
  }

  async function markAll() {
    setIsMarkingAll(true);
    try {
      const response = await fetch("/api/notifications", { method: "PATCH" });
      if (response.ok) {
        setItems((current) => current.map((item) => ({ ...item, isRead: true })));
        router.refresh();
      }
    } finally {
      setIsMarkingAll(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-h1 text-neutral-900">الإشعارات</h1><p className="mt-1 text-body-sm text-secondary">{unreadCount ? `${unreadCount} إشعارات غير مقروءة` : "اطلعت على جميع الإشعارات"}</p></div>
        <Button type="button" variant="outline" size="sm" onClick={markAll} isLoading={isMarkingAll} disabled={!unreadCount}><CheckCheck className="h-4 w-4" />قراءة الكل</Button>
      </div>
      <div className="mt-5 inline-flex rounded-md bg-neutral-100 p-1" role="tablist" aria-label="فلترة الإشعارات">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>الكل</FilterButton>
        <FilterButton active={filter === "unread"} onClick={() => setFilter("unread")}>غير المقروءة</FilterButton>
      </div>
      {visible.length === 0 ? <div className="mt-6"><EmptyState icon={Bell} title={filter === "unread" ? "لا توجد إشعارات غير مقروءة" : "لا توجد إشعارات حتى الآن"} /></div> : (
        <div className="mt-4 flex flex-col gap-2">
          {visible.map((notification) => (
            <Card key={notification.id} className={cn("overflow-hidden", !notification.isRead && "border-primary-200 bg-primary-50/40")}>
              <button type="button" onClick={() => void openNotification(notification)} className="flex w-full items-start justify-between gap-3 p-4 text-start">
                <span className="min-w-0"><span className="block text-body-sm font-semibold text-neutral-800">{notification.title}</span><span className="mt-1 block break-words text-body-sm text-secondary">{notification.body}</span><span className="mt-2 block text-caption text-neutral-400">{formatDateArabic(notification.createdAt)}</span></span>
                {!notification.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn("h-9 rounded px-4 text-body-sm font-medium", active ? "bg-white text-neutral-900 shadow-sm" : "text-secondary")}>{children}</button>;
}
