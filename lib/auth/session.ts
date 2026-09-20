import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./config";
import { withDatabaseRetry } from "@/lib/db/retry";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * قراءة الجلسة الحالية داخل أي Server Component أو Route Handler.
 * مُغلَّفة بـ React.cache() بحيث لو استُدعيت أكثر من مرة في نفس الطلب
 * (مثال: layout.tsx وpage.tsx كلاهما يحتاج الجلسة)، يُنفَّذ الاستعلام فعليًا مرة واحدة فقط.
 */
export const getServerSession = cache(async () => {
  const requestHeaders = await headers();
  const session = await withDatabaseRetry(() => auth.api.getSession({ headers: requestHeaders }));
  if (!session) return null;

  // لا نعتمد على نسخة المستخدم المخزنة مؤقتًا في الكوكيز للحالات الأمنية.
  const accountState = await withDatabaseRetry(() => db.query.users.findFirst({
    columns: { isActive: true, isRestricted: true, role: true },
    where: eq(users.id, session.user.id),
  }));
  if (!accountState) return null;

  return {
    ...session,
    user: { ...session.user, ...accountState },
  };
});

/**
 * اختصار شائع: يُرجع الجلسة أو يرمي خطأ فوري لو لم يكن هناك مستخدم مسجَّل دخوله.
 * يُستخدم في أي Route Handler يفترض مسبقًا وجود مستخدم مصادَق (بعد مرور middleware).
 */
export async function requireSession() {
  const session = await getServerSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  if (session.user.isRestricted) {
    throw new Error("ACCOUNT_RESTRICTED");
  }
  return session;
}

/** Session guard for Server Components. Route handlers should use requireSession instead. */
export async function requirePageSession(loginPath = "/login") {
  const session = await getServerSession();
  if (!session) redirect(loginPath);
  return session;
}
