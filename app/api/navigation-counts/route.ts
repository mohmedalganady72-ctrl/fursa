import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getUnreadMessageCount } from "@/features/messaging/services/messages.service";
import { getUnreadNotificationCount } from "@/features/notifications/services/notifications.service";

export async function GET() {
  const session = await requireSession();
  const [notifications, messages] = await Promise.all([
    getUnreadNotificationCount(session.user.id),
    getUnreadMessageCount(session.user.id),
  ]);
  return NextResponse.json({ data: { notifications, messages } });
}
