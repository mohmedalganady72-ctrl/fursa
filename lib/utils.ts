import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * دمج أسماء كلاسات Tailwind بأمان.
 * تحل مشكلتين معًا:
 * 1) شروط ديناميكية لإضافة/حذف كلاس (عبر clsx)
 * 2) تعارض كلاسات متضاربة من نفس النوع، مثل "p-4 p-6" تصبح "p-6" فقط (عبر tailwind-merge)
 * تُستخدم في كل مكوّن تقريبًا: cn("base-classes", condition && "extra-class", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق تاريخ مختصر بالعربية (مثال: ١٢ سبتمبر ٢٠٢٦).
 * يُستخدم في بطاقات الفٌرص، سجل الإشعارات، وتفاصيل التقديم.
 */
export function formatDateArabic(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * حساب الوقت المتبقي حتى موعد معيّن بصيغة نصية مختصرة (مثال: "٣ أيام متبقية").
 * تُستخدم في شارة "الأقرب لانتهاء التقديم".
 */
export function getRemainingTimeLabel(deadline: Date | string): string {
  const target = typeof deadline === "string" ? new Date(deadline) : deadline;
  const diffMs = target.getTime() - Date.now();

  if (diffMs <= 0) return "انتهى موعد التقديم";

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "يوم واحد متبقٍ";
  if (diffDays === 2) return "يومان متبقيان";
  if (diffDays <= 10) return `${diffDays} أيام متبقية`;
  return `${diffDays} يومًا متبقيًا`;
}
