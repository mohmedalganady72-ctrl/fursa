import { and, desc, asc, eq, ilike, or, sql, gt, exists, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, opportunities, opportunityFields, organizationProfiles, users } from "@/lib/db/schema";
import { OPPORTUNITY_SORT_OPTIONS, OPPORTUNITY_STATUS } from "@/lib/constants";
import type { OpportunityInput } from "../validators/opportunity.schema";
import type { OpportunityFiltersInput } from "../validators/opportunity-filters.schema";
import { closePendingApplications, type Transaction } from "@/features/applications/services/status-transitions";

/**
 * طبقة الوصول لبيانات الفٌرص — كل استعلام Drizzle المتعلق بالفٌرص يعيش هنا حصريًا.
 * لا صفحة ولا route handler يكتب استعلام Drizzle مباشرة؛ الجميع يستدعي هذه الدوال
 * (راجع README.md § نمط الهيكلة، القاعدة الذهبية).
 */

/** إنشاء فٌرصة جديدة (تُستدعى من app/api/opportunities/route.ts بعد التحقق من صلاحية الجهة) */
export async function createOpportunity(
  organizationProfileId: string,
  input: OpportunityInput
) {
  return db.transaction((tx) => insertOpportunity(tx, organizationProfileId, input));
}

async function insertOpportunity(tx: Transaction, organizationProfileId: string, input: OpportunityInput) {
  const [created] = await tx
    .insert(opportunities)
    .values({
      organizationProfileId,
      type: input.type,
      title: input.title,
      description: input.description,
      workMode: input.workMode,
      city: input.city,
      seatsAvailable: input.seatsAvailable,
      applicationDeadline: input.applicationDeadline,
      publishedAt: new Date(),

      // حقول خاصة حسب النوع — القيم غير المنطبقة على النوع الحالي تبقى NULL تلقائيًا
      ...(input.type === "job" && {
        requiredQualification: input.requiredQualification,
        requiredSkills: input.requiredSkills.join(","),
        minimumYearsExperience: input.minimumYearsExperience,
      }),
      ...(input.type === "volunteering" && {
        requiresResume: String(input.requiresResume),
        genderRequirement: input.genderRequirement,
      }),
      ...(input.type === "co_op" && {
        requiredAcademicLevel: input.requiredAcademicLevel,
        requiredUniversity: input.requiredUniversity,
      }),
    })
    .returning();

  if (!created) throw new Error("OPPORTUNITY_CREATE_FAILED");

  if (input.fieldIds.length > 0) {
    await tx.insert(opportunityFields).values(
      input.fieldIds.map((fieldId) => ({ opportunityId: created.id, fieldId }))
    );
  }

  return created;
}

/**
 * لا يوجد "تحديث" للفٌرصة بعد نشرها في هذا الإصدار (راجع وثيقة المتطلبات § 5.7:
 * "بعد نشر الفٌرصة، لا تملك الجهة صلاحية تعديل بياناتها. إذا كانت هناك حاجة لتغيير
 * جوهري، يتم إغلاق الفٌرصة وإنشاء فٌرصة جديدة"). الدالة أدناه تُنفِّذ هذا المسار
 * بالضبط: تُغلق الفٌرصة القديمة (تبقى كسجل تاريخي مقروء) ثم تُنشئ فٌرصة جديدة
 * بالبيانات المحدَّثة، بدل تعديل الصف الأصلي.
 */
export async function closeOpportunityAndCreateReplacement(
  opportunityId: string,
  organizationProfileId: string,
  newOpportunityInput: OpportunityInput
) {
  return db.transaction(async (tx) => {
  const [existing] = await tx.select().from(opportunities).where(and(
      eq(opportunities.id, opportunityId),
      eq(opportunities.organizationProfileId, organizationProfileId)
    )).for("update");

  if (!existing) throw new Error("OPPORTUNITY_NOT_FOUND");
  if (existing.status !== "published") throw new Error("OPPORTUNITY_ALREADY_CLOSED");

    await tx
      .update(opportunities)
      .set({ status: "closed", closedAt: new Date(), closureReason: "replaced_by_organization" })
      .where(eq(opportunities.id, opportunityId));

    await closePendingApplications(tx, opportunityId);
    const replacement = await insertOpportunity(tx, organizationProfileId, newOpportunityInput);
    return replacement;
  });
}

/**
 * إغلاق يدوي بسيط بلا فٌرصة بديلة (مثال: الجهة قررت التراجع عن نشر الفٌرصة كليًا،
 * أو إجراء إداري استثنائي من المدير — راجع § 5.7: "يمكن لمدير النظام تنفيذ إجراءات
 * إدارية استثنائية وفق صلاحياته").
 */
export async function closeOpportunity(
  opportunityId: string,
  organizationProfileId: string,
  reason: string = "manual_closure"
) {
  return db.transaction(async (tx) => {
  const [updated] = await tx
    .update(opportunities)
    .set({ status: "closed", closedAt: new Date(), closureReason: reason })
    .where(
      and(
        eq(opportunities.id, opportunityId),
        eq(opportunities.organizationProfileId, organizationProfileId)
      )
    )
    .returning();

  if (!updated) throw new Error("OPPORTUNITY_NOT_FOUND");
  await closePendingApplications(tx, opportunityId);
  return updated;
  });
}

/**
 * قائمة الفٌرص المفلترة والمرتّبة لصفحة التصفح العامة.
 * ملاحظة أداء: الترتيب "الأكثر مناسبة لي" (BEST_MATCH) لا يُحسَب هنا مباشرة عبر SQL
 * لأنه يعتمد على ملف الباحث الشخصي؛ يُطبَّق كترتيب لاحق (post-sort) في طبقة الـ route
 * بعد جلب الصفحة الحالية من النتائج المرتّبة بالأحدث، عبر features/matching.
 */
export async function listOpportunities(filters: OpportunityFiltersInput, includeNextPage = false) {
  const now = new Date();
  const conditions = [
    eq(opportunities.status, OPPORTUNITY_STATUS.PUBLISHED),
    gt(opportunities.applicationDeadline, now),
    lte(opportunities.applicationStartAt, now),
    eq(organizationProfiles.isApproved, true),
    exists(db.select({ id: users.id }).from(users).where(and(
      eq(users.id, organizationProfiles.userId), eq(users.isActive, true), eq(users.isRestricted, false)
    ))),
  ];

  if (filters.fieldId) conditions.push(exists(db.select({ id: opportunityFields.id }).from(opportunityFields)
    .where(and(eq(opportunityFields.opportunityId, opportunities.id), eq(opportunityFields.fieldId, filters.fieldId)))));

  if (filters.type) conditions.push(eq(opportunities.type, filters.type));

  if (filters.city) conditions.push(eq(opportunities.city, filters.city));
  if (filters.workMode) conditions.push(eq(opportunities.workMode, filters.workMode));

  if (filters.searchQuery) {
    // بحث تقريبي عبر pg_trgm على العنوان واسم الجهة والتخصص (راجع db/rls-policies للفهرس المطابق)
    conditions.push(
      or(
        ilike(opportunities.title, `%${filters.searchQuery}%`),
        ilike(organizationProfiles.name, `%${filters.searchQuery}%`),
        ilike(opportunities.requiredQualification, `%${filters.searchQuery}%`)
      )!
    );
  }

  const applicationCount = sql<number>`(select count(*) from ${applications} where ${applications.opportunityId} = ${opportunities.id})`;
  const orderBy = {
    [OPPORTUNITY_SORT_OPTIONS.NEWEST]: desc(opportunities.createdAt),
    [OPPORTUNITY_SORT_OPTIONS.DEADLINE_SOON]: asc(opportunities.applicationDeadline),
    // "الأقل/الأكثر تقدمًا" تحتاج عدد التقديمات الفعلي — تُحسَب عبر subquery في seatsFilled كتقريب أولي
    [OPPORTUNITY_SORT_OPTIONS.LEAST_APPLIED]: asc(applicationCount),
    [OPPORTUNITY_SORT_OPTIONS.MOST_APPLIED]: desc(applicationCount),
    [OPPORTUNITY_SORT_OPTIONS.BEST_MATCH]: desc(opportunities.createdAt), // fallback؛ يُعاد ترتيبه لاحقًا في الـ route
  }[filters.sortBy];

  const results = await db
    .select()
    .from(opportunities)
    .leftJoin(organizationProfiles, eq(opportunities.organizationProfileId, organizationProfiles.id))
    .where(and(...conditions))
    .orderBy(orderBy, desc(opportunities.id))
    .limit(filters.pageSize + (includeNextPage ? 1 : 0))
    .offset((filters.page - 1) * filters.pageSize);

  return results;
}

/** تفاصيل فٌرصة واحدة (لصفحة العرض والتقديم) */
export async function getOpportunityById(opportunityId: string) {
  return db.query.opportunities.findFirst({
    where: eq(opportunities.id, opportunityId),
    with: {
      organizationProfile: true,
      opportunityFields: { with: { field: true } },
    },
  });
}

/** فٌرص جهة معيّنة (للوحة تحكم الجهة) */
export async function listOrganizationOpportunities(organizationProfileId: string) {
  return db.query.opportunities.findMany({
    where: eq(opportunities.organizationProfileId, organizationProfileId),
    orderBy: desc(opportunities.createdAt),
  });
}
