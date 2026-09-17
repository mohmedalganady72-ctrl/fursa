import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./config";
import { withDatabaseRetry } from "@/lib/db/retry";
import { redirect } from "next/navigation";

/**
 * قراءة الجلسة الحالية داخل أي Server Component أو Route Handler.
 * مُغلَّفة بـ React.cache() بحيث لو استُدعيت أكثر من مرة في نفس الطلب
 * (مثال: layout.tsx وpage.tsx كلاهما يحتاج الجلسة)، يُنفَّذ الاستعلام فعليًا مرة واحدة فقط.
 */
export const getServerSession = cache(async () => {
  const requestHeaders = await headers();
  return withDatabaseRetry(() => auth.api.getSession({ headers: requestHeaders }));
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
  return session;
}

/** Session guard for Server Components. Route handlers should use requireSession instead. */
export async function requirePageSession(loginPath = "/login") {
  const session = await getServerSession();
  if (!session) redirect(loginPath);
  return session;
}
