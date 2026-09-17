import { createServiceRoleClient } from "./server";

/**
 * أسماء الـ buckets في Supabase Storage — قيم ثابتة موحّدة بدل نصوص حرفية متفرقة.
 * تُنشأ هذه الـ buckets يدويًا في لوحة Supabase قبل أول استخدام (خطوة إعداد بنية تحتية،
 * وليست جزءًا من كود التطبيق).
 */
export const STORAGE_BUCKETS = {
  AVATARS: "avatars", // صور شخصية للباحثين
  ORGANIZATION_LOGOS: "organization-logos", // شعارات الجهات
  RESUMES: "resumes", // ملفات CV بصيغة PDF — bucket خاص (private)، ليس عامًا
} as const;

/**
 * رفع ملف إلى Supabase Storage عبر صلاحيات الخادم الكاملة.
 * يُستدعى من داخل Route Handlers بعد التحقق من هوية المستخدم وصلاحيته على الملف.
 */
export async function uploadFile(params: {
  bucket: (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
  path: string; // مثال: `${userId}/resume.pdf`
  file: Buffer;
  contentType: string;
}) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.storage
    .from(params.bucket)
    .upload(params.path, params.file, {
      contentType: params.contentType,
      upsert: true, // يسمح باستبدال الملف عند رفع نسخة جديدة (مثال: تحديث السيرة الذاتية)
    });

  if (error) throw error;
  return data;
}

/** يُرجع رابطًا موقّعًا (صالح لمدة محدودة) لملف في bucket خاص مثل السير الذاتية */
export async function getSignedUrl(params: {
  bucket: (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
  path: string;
  expiresInSeconds?: number;
}) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.storage
    .from(params.bucket)
    .createSignedUrl(params.path, params.expiresInSeconds ?? 3600); // ساعة واحدة افتراضيًا

  if (error) throw error;
  return data.signedUrl;
}

/** يُرجع رابطًا عامًا دائمًا لملف في bucket عام (الصور الشخصية، الشعارات) */
export function getPublicUrl(params: {
  bucket: (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
  path: string;
}) {
  const supabase = createServiceRoleClient();
  const { data } = supabase.storage.from(params.bucket).getPublicUrl(params.path);
  return data.publicUrl;
}
