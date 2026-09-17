"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * عميل Supabase بصلاحيات المفتاح العام (anon key) — آمن للاستخدام في المتصفح.
 * يُستخدم للاشتراك في قنوات Supabase Realtime (الدردشة) من داخل مكوّنات العميل.
 * كل عملية كتابة/قراءة عبر هذا العميل تمر عبر سياسات RLS (راجع db/rls-policies/*.sql).
 */
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
