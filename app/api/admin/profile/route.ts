import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { getServerSession } from "@/lib/auth/session";
import { isAdmin } from "@/features/auth/services/permissions";
import { db } from "@/lib/db";
import { admins, users } from "@/lib/db/schema";
import { withDatabaseRetry } from "@/lib/db/retry";

const updateAdminProfileSchema = z.object({
  displayName: z.string().trim().min(2, "أدخل اسمًا من حرفين على الأقل").max(80),
  email: z.string().trim().toLowerCase().email("أدخل بريدًا إلكترونيًا صحيحًا"),
});

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ message: "يلزم تسجيل الدخول." }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ message: "لا تملك صلاحية تنفيذ هذا الإجراء." }, { status: 403 });

  const parsed = updateAdminProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "تحقق من البيانات المدخلة." }, { status: 400 });
  }

  const emailOwner = await withDatabaseRetry(() => db.query.users.findFirst({
    columns: { id: true },
    where: eq(users.email, parsed.data.email),
  }));
  if (emailOwner && emailOwner.id !== session.user.id) {
    return NextResponse.json({ message: "البريد الإلكتروني مستخدم في حساب آخر." }, { status: 409 });
  }

  const updated = await withDatabaseRetry(() => db.transaction(async (tx) => {
    const admin = await tx.query.admins.findFirst({
      columns: { id: true },
      where: eq(admins.userId, session.user.id),
    });
    if (!admin) return null;

    await tx.update(users).set({
      name: parsed.data.displayName,
      email: parsed.data.email,
      updatedAt: new Date(),
    }).where(eq(users.id, session.user.id));
    await tx.update(admins).set({ displayName: parsed.data.displayName }).where(eq(admins.id, admin.id));
    return parsed.data;
  }));

  if (!updated) return NextResponse.json({ message: "تعذّر العثور على ملف المدير." }, { status: 404 });

  const refreshed = await withDatabaseRetry(() => auth.api.getSession({
    headers: request.headers,
    query: { disableCookieCache: true },
    returnHeaders: true,
  }));
  return NextResponse.json({ data: updated }, { headers: refreshed.headers });
}
