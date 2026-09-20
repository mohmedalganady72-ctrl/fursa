import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api-session";
import { markNotificationAsRead } from "@/features/notifications/services/notifications.service";

/** PATCH /api/notifications/:id/read — تعليم إشعار واحد كمقروء */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const { notificationId } = await params;
  const session = await requireApiSession();
  if (session instanceof Response) return session;

  const updated = await markNotificationAsRead(notificationId, session.user.id);
  if (!updated) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
