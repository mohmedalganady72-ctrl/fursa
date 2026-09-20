import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { reportSchema } from "@/features/messaging/validators/report.schema";
import { createReport } from "@/features/messaging/services/reports.service";
import { db } from "@/lib/db";
import { users, messages, opportunities } from "@/lib/db/schema";
import { getAuthorizedConversation } from "@/features/messaging/services/messages.service";
import { eq } from "drizzle-orm";
import { USER_ROLES } from "@/lib/constants";

/** POST /api/reports — تبليغ عن رسالة/مستخدم/فٌرصة مخالفة (متاح لأي مستخدم مسجَّل دخوله) */
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED", message: "سجّل الدخول لإرسال البلاغ" }, { status: 401 });
  if (session.user.isRestricted) {
    return NextResponse.json({ error: "ACCOUNT_RESTRICTED", message: "الحساب مقيّد حاليًا" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", message: "بيانات البلاغ غير صالحة" }, { status: 400 });
  }

  if (parsed.data.targetType === "user") {
    if (parsed.data.targetId === session.user.id) {
      return NextResponse.json({ error: "SELF_REPORT", message: "لا يمكنك الإبلاغ عن حسابك" }, { status: 400 });
    }
    const target = await db.query.users.findFirst({ columns: { role: true }, where: eq(users.id, parsed.data.targetId) });
    if (!target) return NextResponse.json({ error: "TARGET_NOT_FOUND", message: "الحساب المطلوب غير موجود" }, { status: 404 });
    const validPair = (session.user.role === USER_ROLES.APPLICANT && target.role === USER_ROLES.ORGANIZATION)
      || (session.user.role === USER_ROLES.ORGANIZATION && target.role === USER_ROLES.APPLICANT);
    if (!validPair) return NextResponse.json({ error: "FORBIDDEN", message: "لا يمكن إرسال هذا البلاغ" }, { status: 403 });
  }

  if (parsed.data.targetType === "opportunity") {
    const target = await db.query.opportunities.findFirst({ columns: { id: true }, where: eq(opportunities.id, parsed.data.targetId) });
    if (!target) return NextResponse.json({ error: "TARGET_NOT_FOUND" }, { status: 404 });
  }
  if (parsed.data.targetType === "message") {
    const target = await db.query.messages.findFirst({ columns: { conversationId: true }, where: eq(messages.id, parsed.data.targetId) });
    if (!target) return NextResponse.json({ error: "TARGET_NOT_FOUND" }, { status: 404 });
    try {
      await getAuthorizedConversation(target.conversationId, session.user.id);
    } catch (error) {
      if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      throw error;
    }
  }

  try {
    const created = await createReport(session.user.id, parsed.data);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "REPORT_ALREADY_PENDING") {
      return NextResponse.json({ error: "REPORT_ALREADY_PENDING", message: "لديك بلاغ قيد المراجعة عن هذا الحساب بالفعل" }, { status: 409 });
    }
    throw error;
  }
}
