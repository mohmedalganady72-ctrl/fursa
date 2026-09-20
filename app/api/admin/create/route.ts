import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/api-session";
import { isAdmin } from "@/features/auth/services/permissions";
import { createAdminAccount } from "@/features/admin/services/admin.service";
import { db } from "@/lib/db";
import { admins, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withDatabaseRetry } from "@/lib/db/retry";

const createAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(2).max(80),
});

/**
 * POST /api/admin/create
 * إنشاء حساب مدير جديد من داخل لوحة التحكم — يدخل المدير الجديد بنفس آلية المدير الحالي
 * (بريد + كلمة مرور عبر Better Auth)، لكن دون المرور بخطوة التحقق العادية من البريد
 * أو موافقة إضافية، لأن الإنشاء نفسه يتطلب صلاحية مدير قائم بالفعل.
 */
export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", message: "تحقق من الاسم والبريد الإلكتروني وكلمة المرور." }, { status: 400 });
  }

  const currentAdmin = await withDatabaseRetry(() => db.query.admins.findFirst({ where: eq(admins.userId, session.user.id) }));
  if (!currentAdmin) {
    return NextResponse.json({ error: "ADMIN_RECORD_NOT_FOUND", message: "تعذّر التحقق من حساب المدير الحالي." }, { status: 404 });
  }

  const existingUser = await withDatabaseRetry(() => db.query.users.findFirst({
    columns: { id: true },
    where: eq(users.email, parsed.data.email),
  }));
  if (existingUser) {
    return NextResponse.json({ error: "EMAIL_ALREADY_EXISTS", message: "البريد الإلكتروني مستخدم في حساب آخر." }, { status: 409 });
  }

  try {
    const newAdmin = await createAdminAccount(
      parsed.data.email,
      parsed.data.password,
      parsed.data.displayName,
      currentAdmin.id
    );

    return NextResponse.json({ data: newAdmin }, { status: 201 });
  } catch (error) {
    console.error("[admin/create] Failed to create admin:", error);
    return NextResponse.json({ error: "ADMIN_CREATE_FAILED", message: "تعذّر إنشاء حساب المدير. حاول مرة أخرى." }, { status: 500 });
  }
}
