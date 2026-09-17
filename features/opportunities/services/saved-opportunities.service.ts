import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedOpportunities } from "@/lib/db/schema";

/**
 * "زر حفظ الفٌرصة للباحث المسجل" (راجع وثيقة المتطلبات § 5.10). عملية toggle بسيطة —
 * لا validator منفصل لأن المدخلات (معرّفا الباحث والفٌرصة) تأتي من الجلسة والمسار مباشرة،
 * وقيد uniqueIndex في قاعدة البيانات يمنع الحفظ المكرر دون حاجة لتحقق إضافي في التطبيق.
 */
export async function saveOpportunity(applicantProfileId: string, opportunityId: string) {
  const [saved] = await db
    .insert(savedOpportunities)
    .values({ applicantProfileId, opportunityId })
    .onConflictDoNothing()
    .returning();

  return saved ?? null; // null يعني أنها كانت محفوظة مسبقًا أصلًا (onConflictDoNothing)
}

export async function unsaveOpportunity(applicantProfileId: string, opportunityId: string) {
  await db
    .delete(savedOpportunities)
    .where(
      and(
        eq(savedOpportunities.applicantProfileId, applicantProfileId),
        eq(savedOpportunities.opportunityId, opportunityId)
      )
    );
}

export async function isOpportunitySaved(applicantProfileId: string, opportunityId: string) {
  const existing = await db.query.savedOpportunities.findFirst({
    where: and(
      eq(savedOpportunities.applicantProfileId, applicantProfileId),
      eq(savedOpportunities.opportunityId, opportunityId)
    ),
  });
  return !!existing;
}

/**
 * مجموعة (Set) بمعرّفات الفٌرص المحفوظة ضمن قائمة معرّفات معطاة — استعلام واحد فقط،
 * بدل استدعاء isOpportunitySaved لكل بطاقة على حدة (N+1). تُستدعى فقط من صفحات
 * الباحث المسجَّل (راجع صفحات opportunities/jobs|volunteering|co-op)، وليس من
 * listOpportunities نفسها لأنها تخدم الزوار غير المسجَّلين أيضًا.
 */
export async function getSavedOpportunityIds(
  applicantProfileId: string,
  opportunityIds: string[]
): Promise<Set<string>> {
  if (opportunityIds.length === 0) return new Set();

  const rows = await db
    .select({ opportunityId: savedOpportunities.opportunityId })
    .from(savedOpportunities)
    .where(
      and(
        eq(savedOpportunities.applicantProfileId, applicantProfileId),
        inArray(savedOpportunities.opportunityId, opportunityIds)
      )
    );

  return new Set(rows.map((r) => r.opportunityId));
}

/** قائمة الفٌرص المحفوظة لباحث معيّن (تُستخدم في Dashboard الباحث — راجع § 5.20) */
export async function listSavedOpportunities(applicantProfileId: string) {
  return db.query.savedOpportunities.findMany({
    where: eq(savedOpportunities.applicantProfileId, applicantProfileId),
    with: { opportunity: { with: { organizationProfile: true } } },
    orderBy: desc(savedOpportunities.createdAt),
  });
}
