import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

function getLegacyJwtRole(key: string) {
  try {
    const payload = key.split(".")[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role as string | undefined;
  } catch {
    return null;
  }
}

/**
 * عميل Supabase بصلاحيات الخادم الكاملة (service role) — يتجاوز سياسات RLS بالكامل.
 * يُستخدم فقط داخل Route Handlers وServer Actions لعمليات إدارية موثوقة
 * (مثل: اعتماد المدير لجهة، رفع ملف نيابة عن مستخدم بعد التحقق من صلاحيته يدويًا في الكود).
 * لا يُستورد أبدًا في أي مكوّن يعمل على المتصفح (Client Component).
 */
export function createServiceRoleClient() {
  const role = getLegacyJwtRole(env.SUPABASE_SERVICE_ROLE_KEY);
  if (role && role !== "service_role") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must contain a service_role key, not an anon key");
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
