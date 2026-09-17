import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { MAX_DAILY_APPLICATIONS_PER_TYPE } from "@/lib/constants";

export const SETTING_KEYS = {
  DAILY_APPLICATION_LIMIT_PER_TYPE: "daily_application_limit_per_type",
} as const;

/**
 * يقرأ إعدادًا من system_settings، ويرجع القيمة الافتراضية من lib/constants.ts
 * إن لم يكن الإعداد موجودًا في قاعدة البيانات بعد (أول تشغيل قبل أي تخصيص إداري).
 * هذا يبقي المشروع يعمل فورًا بعد db:migrate دون الحاجة لبيانات seed إضافية،
 * بينما يسمح لمدير المنصة بتجاوز القيمة الافتراضية لاحقًا دون نشر كود جديد.
 */
export async function getDailyApplicationLimitPerType(): Promise<number> {
  const setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, SETTING_KEYS.DAILY_APPLICATION_LIMIT_PER_TYPE),
  });

  if (setting && typeof setting.value === "number") {
    return setting.value;
  }

  return MAX_DAILY_APPLICATIONS_PER_TYPE; // القيمة الافتراضية المقترحة في الوثيقة: فٌرصتان يوميًا
}

/** تحديث الحد من لوحة المدير (راجع وثيقة المتطلبات § 5.12) */
export async function setDailyApplicationLimitPerType(newValue: number) {
  if (!Number.isInteger(newValue) || newValue < 1) {
    throw new Error("INVALID_LIMIT_VALUE");
  }

  await db
    .insert(systemSettings)
    .values({
      key: SETTING_KEYS.DAILY_APPLICATION_LIMIT_PER_TYPE,
      value: newValue,
      description: "الحد الأقصى لعدد التقديمات اليومية لكل نوع فٌرصة",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: newValue, updatedAt: new Date() },
    });
}
