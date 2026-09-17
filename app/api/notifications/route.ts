import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { listUserNotifications, markAllNotificationsAsRead } from "@/features/notifications/services/notifications.service";

/** GET /api/notifications?unread=true — إشعارات المستخدم الحالي */
export async function GET(request: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const results = await listUserNotifications(session.user.id, unreadOnly);
  return NextResponse.json({ data: results });
}

/** PATCH /api/notifications — تعليم جميع إشعارات المستخدم الحالي كمقروءة */
export async function PATCH() {
  const session = await requireSession();
  await markAllNotificationsAsRead(session.user.id);
  return NextResponse.json({ data: { success: true } });
}
