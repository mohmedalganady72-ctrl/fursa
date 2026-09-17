import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { markNotificationAsRead } from "@/features/notifications/services/notifications.service";

/** PATCH /api/notifications/:id/read — تعليم إشعار واحد كمقروء */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const { notificationId } = await params;
  const session = await requireSession();

  const updated = await markNotificationAsRead(notificationId, session.user.id);
  if (!updated) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
