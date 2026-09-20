import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/api-session";
import { isAdmin } from "@/features/auth/services/permissions";
import { setUserRestriction } from "@/features/admin/services/admin.service";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { withDatabaseRetry } from "@/lib/db/retry";

const restrictionSchema = z.object({
  restricted: z.boolean(),
  reportId: z.string().uuid().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ message: "لا تملك صلاحية تنفيذ هذا الإجراء." }, { status: 403 });
  }

  const parsed = restrictionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "بيانات الإجراء غير صالحة." }, { status: 400 });
  }

  const admin = await withDatabaseRetry(() => db.query.admins.findFirst({
    columns: { id: true },
    where: eq(admins.userId, session.user.id),
  }));
  if (!admin) return NextResponse.json({ message: "تعذّر العثور على حساب المدير." }, { status: 404 });

  try {
    const { userId } = await params;
    const result = await setUserRestriction(userId, parsed.data.restricted, admin.id, parsed.data.reportId);
    return NextResponse.json({ data: result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (code === "USER_NOT_FOUND") {
      return NextResponse.json({ message: "الحساب غير موجود." }, { status: 404 });
    }
    if (code === "ADMIN_RESTRICTION_FORBIDDEN") {
      return NextResponse.json({ message: "لا يمكن تقييد حسابات المديرين من هذا الإجراء." }, { status: 403 });
    }
    if (code === "REPORT_TARGET_MISMATCH") {
      return NextResponse.json({ message: "البلاغ لا يخص هذا الحساب." }, { status: 400 });
    }
    throw error;
  }
}
