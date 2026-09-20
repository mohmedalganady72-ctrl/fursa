import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api-session";
import { broadcastNotificationSchema } from "@/features/admin/validators/broadcast.schema";
import { broadcastNotification } from "@/features/admin/services/broadcast.service";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/** POST /api/admin/broadcast — إرسال إشعار موجّه لفئة كاملة من المستخدمين */
export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) return session;

  const body = await request.json();
  const parsed = broadcastNotificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const admin = await db.query.admins.findFirst({ where: eq(admins.userId, session.user.id) });
    if (!admin) return NextResponse.json({ error: "FORBIDDEN", message: "لا يملك الحساب الحالي صلاحيات المدير" }, { status: 403 });
    const result = await broadcastNotification(parsed.data, admin.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[admin-broadcast]", error);
    return NextResponse.json({ error: "BROADCAST_FAILED", message: "تعذّر حفظ الإشعارات. حاول مرة أخرى بعد لحظات." }, { status: 500 });
  }
}
