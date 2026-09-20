import { and, eq, gte, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, opportunities } from "@/lib/db/schema";
import type { OpportunityType } from "@/lib/constants";
import { getDailyApplicationLimitPerType } from "@/features/admin/services/system-settings.service";

/**
 * يتحقق من عدم تجاوز الباحث الحد الأقصى اليومي لكل نوع فٌرصة قبل قبول تقديم جديد.
 * الحد قابل للتعديل من لوحة المدير دون نشر كود جديد (راجع وثيقة المتطلبات § 5.12
 * و§ 15: "يجب تطبيق الحد على الخادم" — القيمة تُقرأ هنا من system_settings،
 * وهذا الفحص نفسه يُستدعى فقط من features/applications/services/applications.service.ts
 * على الخادم، وليس من أي مكوّن عميل، فلا يمكن تجاوزه عبر تلاعب بالواجهة).
 *
 * ملاحظة توقيت: المقارنة تعتمد التوقيت المحلي لخادم قاعدة البيانات كتقريب أولي
 * لـ"المنطقة الزمنية المعتمدة للمنصة" (راجع § 5.12)؛ عند تحديد منطقة زمنية رسمية
 * ثابتة للمنصة لاحقًا، يُستبدَل startOfDay أدناه بحساب صريح لتلك المنطقة بدل توقيت الخادم.
 */
export async function assertDailyApplicationLimitNotExceeded(
  applicantProfileId: string,
  opportunityType: OpportunityType,
  client: Pick<typeof db, "select" | "query"> = db
): Promise<void> {
  const dailyLimit = await getDailyApplicationLimitPerType(client);

  const riyadhOffset = 3 * 60 * 60 * 1000;
  const localDay = new Date(Date.now() + riyadhOffset).toISOString().slice(0, 10);
  const startOfDay = new Date(`${localDay}T00:00:00+03:00`);

  const submittedTodayRows = await client
    .select({ value: count() })
    .from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .where(
      and(
        eq(applications.applicantProfileId, applicantProfileId),
        eq(opportunities.type, opportunityType),
        gte(applications.submittedAt, startOfDay)
      )
    );

  const submittedToday = submittedTodayRows[0]?.value ?? 0;

  if (submittedToday >= dailyLimit) {
    throw new Error("DAILY_APPLICATION_LIMIT_EXCEEDED");
  }
}
