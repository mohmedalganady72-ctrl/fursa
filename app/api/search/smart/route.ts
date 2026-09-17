import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { isApplicant } from "@/features/auth/services/permissions";
import { db } from "@/lib/db";
import { applicantProfiles, opportunities } from "@/lib/db/schema";
import { calculateMatchScore } from "@/features/matching/services/scoring-engine";
import type { ApplicantMatchProfile, OpportunityMatchCriteria } from "@/features/matching/types";

/**
 * GET /api/search/smart
 * يحسب درجة توافق الباحث مع كل الفرص المفتوحة من نوع "عمل" (البحث الذكي موثَّق
 * في وثيقة المتطلبات لفرص العمل تحديدًا)، ويُعيدها مرتَّبة تنازليًا حسب الدرجة.
 *
 * ملاحظة أداء: هذا التطبيق الأولي يحسب الدرجة لكل الفرص المفتوحة في الذاكرة،
 * وهو مقبول لحجم بيانات مرحلة الإطلاق. مع نمو عدد الفرص، يُستبدل هذا بحساب
 * مبدئي مُرشِّح عبر SQL (تقاطع مجالات/مدينة كحد أدنى) قبل تطبيق الحساب الكامل
 * فقط على مجموعة مختصرة من المرشحين.
 */
export async function GET() {
  const session = await requireSession();
  if (!isApplicant(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const profile = await db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.userId, session.user.id),
    with: { applicantFields: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "APPLICANT_PROFILE_NOT_FOUND" }, { status: 404 });
  }

  const applicantMatchProfile: ApplicantMatchProfile = {
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

  const openJobs = await db.query.opportunities.findMany({
    where: eq(opportunities.status, "published"),
    with: { opportunityFields: true, organizationProfile: true },
  });

  const scored = openJobs
    .filter((opp) => opp.type === "job")
    .map((opp) => {
      const criteria: OpportunityMatchCriteria = {
        type: opp.type,
        fieldIds: opp.opportunityFields.map((f) => f.fieldId),
        city: opp.city,
        genderRequirement: null,
        requiredQualification: opp.requiredQualification,
        requiredSkills: opp.requiredSkills?.split(",").map((s) => s.trim()) ?? [],
        requiredUniversity: null,
        requiredAcademicLevel: null,
        minimumYearsExperience: opp.minimumYearsExperience,
      };

      const { totalScore } = calculateMatchScore(applicantMatchProfile, criteria);

      return {
        id: opp.id,
        type: opp.type,
        title: opp.title,
        organizationName: opp.organizationProfile?.name ?? "",
        organizationLogoUrl: opp.organizationProfile?.logoUrl,
        city: opp.city,
        workMode: opp.workMode,
        applicationDeadline: opp.applicationDeadline,
        compatibilityScore: totalScore,
      };
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return NextResponse.json({ data: scored });
}
