import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getUnreadMessageCount } from "@/features/messaging/services/messages.service";
import { getUnreadNotificationCount } from "@/features/notifications/services/notifications.service";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (session.user.isRestricted) {
    return NextResponse.json({ error: "ACCOUNT_RESTRICTED" }, { status: 403 });
  }
  const [notifications, messages] = await Promise.all([
    getUnreadNotificationCount(session.user.id),
    getUnreadMessageCount(session.user.id),
  ]);
  return NextResponse.json({ data: { notifications, messages } });
}
