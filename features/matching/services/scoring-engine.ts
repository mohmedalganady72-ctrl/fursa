import { OPPORTUNITY_TYPES } from "@/lib/constants";
import {
  VOLUNTEERING_WEIGHTS,
  CO_OP_WEIGHTS,
  JOB_WEIGHTS,
} from "./scoring-weights";
import type {
  ApplicantMatchProfile,
  OpportunityMatchCriteria,
  MatchScoreResult,
} from "../types";

/**
 * محرك حساب درجة التوافق (Weighted Scoring) — راجع docs/design-system.md
 * ووثيقة المتطلبات § 7 للتفاصيل الكاملة. هذا ترشيح بنيوي (Structured Matching)
 * عبر مقارنات مباشرة، وليس بحثًا دلاليًا (Vector/Semantic) — قرار موثَّق ومبرَّر
 * في README.md § لماذا لا يوجد Vector Search.
 *
 * تنبيه مهم: هذه الدرجة إرشادية فقط للجهة. لا تُستخدم أبدًا لاتخاذ قرار آلي بالقبول/الرفض.
 */

// ============ دوال مساعدة لكل معيار — كل دالة تُرجع نسبة تحقق بين 0 و1 ============

/** نسبة تقاطع مجالات الباحث مع مجالات الفٌرصة المطلوبة */
function scoreFieldsOverlap(applicantFieldIds: string[], requiredFieldIds: string[]): number {
  if (requiredFieldIds.length === 0) return 1; // لا شرط مجال = تحقق كامل تلقائيًا
  if (applicantFieldIds.length === 0) return 0;

  const applicantSet = new Set(applicantFieldIds);
  const matched = requiredFieldIds.filter((id) => applicantSet.has(id)).length;
  return matched / requiredFieldIds.length;
}

/** تطابق المدينة (تام أو صفر — لا تدرّج جزئي هنا لبساطة المعيار ووضوحه للمستخدم) */
function scoreCityMatch(applicantCity: string, requiredCity: string): number {
  return applicantCity.trim().toLowerCase() === requiredCity.trim().toLowerCase() ? 1 : 0;
}

/** تطابق الجنس فقط عند وجود شرط صريح في الفٌرصة؛ وإلا يُعامَل كمعيار محقَّق بالكامل */
function scoreGenderMatch(
  applicantGender: "male" | "female" | null,
  requirement: "male" | "female" | null
): number {
  if (!requirement) return 1;
  return applicantGender === requirement ? 1 : 0;
}

/**
 * تشابه نصي تقريبي بسيط بين نص الباحث (نبذة، تخصص) ونص الفٌرصة (وصف، مهارات مطلوبة).
 * هذه نسخة تطبيقية مبسّطة (تقاطع الكلمات المفتاحية) تعمل في طبقة التطبيق كبديل فوري؛
 * النسخة الإنتاجية تستبدلها باستعلام SQL فعلي عبر pg_trgm (similarity())
 * مباشرة في قاعدة البيانات — راجع features/opportunities/services/opportunities.service.ts
 * عند بناء استعلام الترشيح الكامل، لأن ذلك أسرع من سحب كل النصوص وحسابها في Node.
 */
function scoreTextSimilarity(applicantText: string | null, referenceText: string | null): number {
  if (!applicantText || !referenceText) return 0;

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2);

  const applicantWords = new Set(normalize(applicantText));
  const referenceWords = normalize(referenceText);

  if (referenceWords.length === 0) return 1;

  const matched = referenceWords.filter((word) => applicantWords.has(word)).length;
  return matched / referenceWords.length;
}

/** نسبة تقاطع مهارات الباحث (من الملف الشخصي + CV) مع المهارات المطلوبة في الفٌرصة */
function scoreSkillsOverlap(applicantSkills: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 1;
  if (applicantSkills.length === 0) return 0;

  const applicantSet = new Set(applicantSkills.map((s) => s.toLowerCase().trim()));
  const matched = requiredSkills.filter((s) => applicantSet.has(s.toLowerCase().trim())).length;
  return matched / requiredSkills.length;
}

/** تطابق المؤهل أو التخصص كنص (مطابقة تامة مبسّطة؛ قابلة للتطوير لاحقًا لمرادفات المؤهلات) */
function scoreExactTextMatch(applicantValue: string | null, requiredValue: string | null): number {
  if (!requiredValue) return 1;
  if (!applicantValue) return 0;
  return applicantValue.trim().toLowerCase() === requiredValue.trim().toLowerCase() ? 1 : 0;
}

/**
 * تقدير نسبة تحقق سنوات الخبرة. لا حد أدنى مطلوب (null أو 0) = معيار محقَّق بالكامل (1)،
 * بنفس منطق بقية معايير "الشرط الاختياري" في هذا الملف (راجع scoreGenderMatch مثلًا).
 * إن وُجد حد أدنى ولم يذكر الباحث خبرته إطلاقًا، تُحتسَب النسبة صفرًا — لا نفترض توافقًا.
 */
function scoreExperience(
  applicantYears: number | null,
  minimumRequiredYears: number | null
): number {
  if (!minimumRequiredYears || minimumRequiredYears <= 0) return 1;
  if (applicantYears === null) return 0;
  return Math.min(applicantYears / minimumRequiredYears, 1);
}

// ============ الدالة الرئيسية — نقطة الدخول الوحيدة المستخدَمة من بقية المشروع ============

export function calculateMatchScore(
  applicant: ApplicantMatchProfile,
  criteria: OpportunityMatchCriteria
): MatchScoreResult {
  switch (criteria.type) {
    case OPPORTUNITY_TYPES.VOLUNTEERING:
      return calculateVolunteeringScore(applicant, criteria);
    case OPPORTUNITY_TYPES.CO_OP:
      return calculateCoOpScore(applicant, criteria);
    case OPPORTUNITY_TYPES.JOB:
      return calculateJobScore(applicant, criteria);
  }
}

function calculateVolunteeringScore(
  applicant: ApplicantMatchProfile,
  criteria: OpportunityMatchCriteria
): MatchScoreResult {
  const breakdown = {
    fields: scoreFieldsOverlap(applicant.fieldIds, criteria.fieldIds),
    skillsAndExperience: scoreSkillsOverlap(applicant.skills, criteria.requiredSkills),
    city: scoreCityMatch(applicant.city, criteria.city),
    bioDescription: scoreTextSimilarity(applicant.bio, criteria.requiredSkills.join(" ")),
    gender: scoreGenderMatch(applicant.gender, criteria.genderRequirement),
  };

  const totalScore = Object.entries(breakdown).reduce(
    (sum, [key, value]) => sum + value * VOLUNTEERING_WEIGHTS[key as keyof typeof VOLUNTEERING_WEIGHTS],
    0
  );

  return { totalScore: Math.round(totalScore * 100), breakdown };
}

function calculateCoOpScore(
  applicant: ApplicantMatchProfile,
  criteria: OpportunityMatchCriteria
): MatchScoreResult {
  const breakdown = {
    major: scoreExactTextMatch(applicant.major, criteria.requiredUniversity ? applicant.major : null) ||
      scoreTextSimilarity(applicant.major, criteria.requiredSkills.join(" ")),
    universityAndAcademicRequirements: scoreExactTextMatch(
      applicant.university,
      criteria.requiredUniversity
    ),
    academicLevel: scoreExactTextMatch(applicant.academicLevel, criteria.requiredAcademicLevel),
    fields: scoreFieldsOverlap(applicant.fieldIds, criteria.fieldIds),
    city: scoreCityMatch(applicant.city, criteria.city),
    bioDescription: scoreTextSimilarity(applicant.bio, criteria.requiredSkills.join(" ")),
  };

  const totalScore = Object.entries(breakdown).reduce(
    (sum, [key, value]) => sum + value * CO_OP_WEIGHTS[key as keyof typeof CO_OP_WEIGHTS],
    0
  );

  return { totalScore: Math.round(totalScore * 100), breakdown };
}

function calculateJobScore(
  applicant: ApplicantMatchProfile,
  criteria: OpportunityMatchCriteria
): MatchScoreResult {
  const breakdown = {
    fieldAndSpecialization:
      scoreFieldsOverlap(applicant.fieldIds, criteria.fieldIds) * 0.5 +
      scoreTextSimilarity(applicant.specialization, criteria.requiredSkills.join(" ")) * 0.5,
    requiredSkills: scoreSkillsOverlap(applicant.skills, criteria.requiredSkills),
    experience: scoreExperience(applicant.yearsOfExperience, criteria.minimumYearsExperience),
    // معلومات مستخرجة من CV: تُقاس هنا كغنى بيانات الباحث (وجود مهارات مستخرجة فعليًا)
    // — القيمة الفعلية الدقيقة تُحسب في cv-parsing عبر compareExtractedDataToRequirements
    cvExtractedInfo: applicant.skills.length > 0 ? 1 : 0,
    qualification: scoreExactTextMatch(applicant.qualification, criteria.requiredQualification),
    city: scoreCityMatch(applicant.city, criteria.city),
  };

  const totalScore = Object.entries(breakdown).reduce(
    (sum, [key, value]) => sum + value * JOB_WEIGHTS[key as keyof typeof JOB_WEIGHTS],
    0
  );

  return { totalScore: Math.round(totalScore * 100), breakdown };
}
