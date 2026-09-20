import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  opportunities,
  opportunityFields,
  applicantProfiles,
  applicantFields,
  applicationStatusHistory,
  organizationProfiles,
  users,
} from "@/lib/db/schema";
import { assertDailyApplicationLimitNotExceeded } from "@/lib/rate-limit";
import { calculateMatchScore } from "@/features/matching/services/scoring-engine";
import type { ApplicantMatchProfile, OpportunityMatchCriteria } from "@/features/matching/types";
import type { ApplicationInput } from "../validators/application.schema";
import { APPLICATION_STATUS, OPPORTUNITY_STATUS } from "@/lib/constants";
import { getServerSession } from "@/lib/auth/session";

function isDuplicateApplicationError(error: unknown): boolean {
  let current: unknown = error;
  while (current && typeof current === "object") {
    const candidate = current as { code?: string; constraint_name?: string; cause?: unknown };
    if (candidate.code === "23505" && candidate.constraint_name === "applications_unique_idx") return true;
    current = candidate.cause;
  }
  return false;
}

/**
 * يبني كائن معايير المطابقة (OpportunityMatchCriteria) من صف فٌرصة حقيقي في قاعدة البيانات.
 * فصل هذه الدالة عن scoring-engine.ts يبقي محرك الحساب خاليًا تمامًا من تفاصيل Drizzle/SQL
 * (قابل للاختبار بمعزل تام — راجع tests/unit/matching).
 */
async function buildOpportunityCriteria(opportunityId: string, client: Pick<typeof db, "query"> = db): Promise<OpportunityMatchCriteria> {
  const opportunity = await client.query.opportunities.findFirst({
    where: eq(opportunities.id, opportunityId),
    with: { opportunityFields: true },
  });

  if (!opportunity) throw new Error("OPPORTUNITY_NOT_FOUND");

  return {
    type: opportunity.type,
    fieldIds: opportunity.opportunityFields.map((f) => f.fieldId),
    city: opportunity.city,
    genderRequirement: (opportunity.genderRequirement as "male" | "female" | null) ?? null,
    requiredQualification: opportunity.requiredQualification,
    requiredSkills: opportunity.requiredSkills?.split(",").map((s) => s.trim()) ?? [],
    requiredUniversity: opportunity.requiredUniversity,
    requiredAcademicLevel: opportunity.requiredAcademicLevel,
    minimumYearsExperience: opportunity.minimumYearsExperience,
  };
}

/** يبني كائن ملف الباحث من صف applicant_profiles حقيقي (+ بيانات CV المُحلَّلة إن وُجدت) */
async function buildApplicantMatchProfile(applicantProfileId: string, client: Pick<typeof db, "query"> = db): Promise<ApplicantMatchProfile> {
  const profile = await client.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.id, applicantProfileId),
    with: { applicantFields: true },
  });

  if (!profile) throw new Error("APPLICANT_PROFILE_NOT_FOUND");

  // ملاحظة: مهارات وسنوات الخبرة المستخرجة من CV (features/cv-parsing) تُدمَج هنا لاحقًا
  // عبر جدول/حقل تخزين مخصص لنتيجة آخر تحليل — غير مُفعَّل بعد في هذا الإصدار الأساسي من الخدمة.
  return {
    fieldIds: profile.applicantFields.map((f) => f.fieldId),
    city: profile.city,
    gender: profile.gender,
    bio: profile.bio,
    qualification: profile.qualification,
    specialization: profile.specialization,
    university: profile.university,
    academicLevel: profile.academicLevel,
    major: null,
    skills: [...(profile.skills ?? []), ...(profile.parsedResume?.skills ?? [])],
    yearsOfExperience: profile.parsedResume?.yearsOfExperience ?? null,
  };
}

/**
 * تقديم جديد — نقطة الدخول الوحيدة لإنشاء تقديم في كل المشروع.
 * يفرض بالترتيب: الحد اليومي → عدم التكرار (يُفرَض أيضًا عبر uniqueIndex في قاعدة البيانات
 * كطبقة حماية ثانية) → حساب درجة التوافق قبل الحفظ.
 */
export async function submitApplication(applicantProfileId: string, input: ApplicationInput) {
  return db.transaction(async (tx) => {
  // Match the decision writers' lock order; serialize each applicant's daily quota.
  const [opportunity] = await tx.select().from(opportunities)
    .where(eq(opportunities.id, input.opportunityId)).for("update");
  if (!opportunity) throw new Error("OPPORTUNITY_NOT_FOUND");
  const [profile] = await tx.select().from(applicantProfiles)
    .where(eq(applicantProfiles.id, applicantProfileId)).for("update");
  if (!profile) throw new Error("APPLICANT_PROFILE_NOT_FOUND");
  if (input.opportunityType !== opportunity.type) throw new Error("OPPORTUNITY_TYPE_MISMATCH");
  if (opportunity.applicationStartAt > new Date()) throw new Error("OPPORTUNITY_NOT_STARTED");
  const [owner] = await tx.select({ id: users.id }).from(organizationProfiles)
    .innerJoin(users, eq(users.id, organizationProfiles.userId))
    .where(and(eq(organizationProfiles.id, opportunity.organizationProfileId),
      eq(organizationProfiles.isApproved, true), eq(users.isActive, true), eq(users.isRestricted, false)));
  if (!owner) throw new Error("OPPORTUNITY_CLOSED");
  if (input.opportunityType !== "co_op") {
    if (opportunity.requiresResume === "true" && !input.resumeUrl) throw new Error("RESUME_REQUIRED");
    if (input.resumeUrl && (!input.resumeUrl.startsWith(`${profile.userId}/`) || input.resumeUrl.includes(".."))) {
      throw new Error("INVALID_RESUME_PATH");
    }
  }
  // الفٌرصة يجب أن تكون منشورة وغير منتهية الصلاحية زمنيًا لقبول تقديم جديد
  // (راجع وثيقة المتطلبات § 3 قاعدة 13: "الفٌرص المنتهية أو المغلقة لا تقبل طلبات جديدة"
  // و§ 12 معيار القبول: يُفشَل الطلب على مستوى الخادم حتى لو أُرسل مباشرة عبر API)
  if (opportunity.status !== OPPORTUNITY_STATUS.PUBLISHED) {
    throw new Error("OPPORTUNITY_CLOSED");
  }
  if (opportunity.applicationDeadline < new Date()) {
    throw new Error("OPPORTUNITY_EXPIRED");
  }

  if (await hasApplicantApplied(applicantProfileId, input.opportunityId, tx)) {
    throw new Error("APPLICATION_ALREADY_EXISTS");
  }

  await assertDailyApplicationLimitNotExceeded(applicantProfileId, opportunity.type, tx);

  const [criteria, applicantProfile] = await Promise.all([
    buildOpportunityCriteria(input.opportunityId, tx),
    buildApplicantMatchProfile(applicantProfileId, tx),
  ]);

  const matchResult = calculateMatchScore(applicantProfile, criteria);

  let created;
  try {
    [created] = await tx
      .insert(applications)
      .values({
      opportunityId: input.opportunityId,
      applicantProfileId,
      status: APPLICATION_STATUS.APPLIED,
      compatibilityScore: matchResult.totalScore,
      // حفظ تفصيل الأوزان المستخدمة وقت التقييم (راجع وثيقة المتطلبات § 5.16:
      // "حفظ نسخة من الأوزان المستخدمة عند تقييم الطلب") — يضمن أن شرح الدرجة
      // لاحقًا في الواجهة يبقى دقيقًا حتى لو تغيّرت الأوزان الافتراضية بالنظام مستقبلًا
      compatibilityBreakdown: JSON.stringify(matchResult.breakdown),

      ...(input.opportunityType === "job" && {
        whySuitableText: input.whySuitableText,
        resumeUrl: input.resumeUrl,
      }),
      ...(input.opportunityType === "volunteering" && {
        resumeUrl: input.resumeUrl ?? null,
      }),
      ...(input.opportunityType === "co_op" && {
        academicId: input.academicId,
        academicLevel: input.academicLevel,
        university: input.university,
        major: input.major,
      }),
      })
      .returning();
  } catch (error) {
    if (isDuplicateApplicationError(error)) {
      throw new Error("APPLICATION_ALREADY_EXISTS");
    }
    throw error;
  }

  if (!created) throw new Error("APPLICATION_CREATE_FAILED");

  // أول صف في سجل تاريخ الحالة لهذا التقديم — oldStatus = null لأنه إنشاء جديد
  await tx.insert(applicationStatusHistory).values({
    applicationId: created.id,
    oldStatus: null,
    newStatus: APPLICATION_STATUS.APPLIED,
  });

  return created;
  });
}

/** يستخدم في الخادم والواجهة لمنع عرض نموذج تقديم أُرسل سابقًا. */
export async function hasApplicantApplied(applicantProfileId: string, opportunityId: string, client: Pick<typeof db, "query"> = db) {
  const existing = await client.query.applications.findFirst({
    columns: { id: true },
    where: and(
      eq(applications.applicantProfileId, applicantProfileId),
      eq(applications.opportunityId, opportunityId)
    ),
  });
  return Boolean(existing);
}

/** قائمة تقديمات باحث معيّن مع تفاصيل الفٌرصة (للوحة "تقديماتي") */
export async function listApplicantApplications(applicantProfileId: string) {
  return db.query.applications.findMany({
    where: eq(applications.applicantProfileId, applicantProfileId),
    with: { opportunity: { with: { organizationProfile: true } } },
    orderBy: desc(applications.submittedAt),
  });
}

/**
 * قائمة المتقدمين على فٌرصة معيّنة، مرتّبة تنازليًا حسب درجة التوافق (الترتيب الذكي).
 * راجع وثيقة المتطلبات § "ترتيب ذكي للمتقدمين" — إرشادي فقط، القرار للجهة.
 */
export async function listOpportunityApplicants(opportunityId: string, organizationUserId: string) {
  const owner = await db.select({ id: opportunities.id }).from(opportunities)
    .innerJoin(organizationProfiles, eq(opportunities.organizationProfileId, organizationProfiles.id))
    .where(and(eq(opportunities.id, opportunityId), eq(organizationProfiles.userId, organizationUserId),
      eq(organizationProfiles.isApproved, true)));
  if (!owner.length) throw new Error("FORBIDDEN");
  return db.query.applications.findMany({
    where: eq(applications.opportunityId, opportunityId),
    with: { applicantProfile: true },
    orderBy: desc(applications.compatibilityScore),
  });
}

export async function listOpportunityApplicantPreviews(opportunityId: string) {
  const session = await getServerSession();
  if (session?.user.role !== "applicant") return [];
  return db.select({ id: applications.id,
    applicantProfile: { fullName: applicantProfiles.fullName, avatarUrl: applicantProfiles.avatarUrl },
  }).from(applications).innerJoin(applicantProfiles, eq(applications.applicantProfileId, applicantProfiles.id))
    .where(eq(applications.opportunityId, opportunityId)).limit(50);
}
