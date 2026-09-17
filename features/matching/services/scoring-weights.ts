import { OPPORTUNITY_TYPES, type OpportunityType } from "@/lib/constants";

/**
 * جداول الأوزان لكل نوع فرصة — مفصولة عمدًا عن منطق الحساب (scoring-engine.ts)
 * حتى يسهل تعديل الأوزان مستقبلًا (تجربة A/B، ملاحظات ميدانية) دون لمس الخوارزمية نفسها.
 * القيم مطابقة حرفيًا لوثيقة المتطلبات § 7.
 */

export const VOLUNTEERING_WEIGHTS = {
  fields: 0.4,
  skillsAndExperience: 0.3,
  city: 0.15,
  bioDescription: 0.1,
  gender: 0.05, // تُطبَّق فقط إذا كانت الفرصة تشترط جنسًا محددًا، وإلا تُعاد توزيعها (راجع scoring-engine)
} as const;

export const CO_OP_WEIGHTS = {
  major: 0.4,
  universityAndAcademicRequirements: 0.15,
  academicLevel: 0.15,
  fields: 0.15,
  city: 0.1,
  bioDescription: 0.05,
} as const;

export const JOB_WEIGHTS = {
  fieldAndSpecialization: 0.3,
  requiredSkills: 0.25,
  experience: 0.2,
  cvExtractedInfo: 0.1,
  qualification: 0.1,
  city: 0.05,
} as const;

export function getWeightsForType(type: OpportunityType) {
  switch (type) {
    case OPPORTUNITY_TYPES.VOLUNTEERING:
      return VOLUNTEERING_WEIGHTS;
    case OPPORTUNITY_TYPES.CO_OP:
      return CO_OP_WEIGHTS;
    case OPPORTUNITY_TYPES.JOB:
      return JOB_WEIGHTS;
  }
}

// تحقق وقت التطوير أن مجموع كل جدول أوزان يساوي 1 تمامًا (يُستدعى من tests/unit/matching)
export function assertWeightsSumToOne(weights: Record<string, number>): boolean {
  const sum = Object.values(weights).reduce((acc, w) => acc + w, 0);
  return Math.abs(sum - 1) < 0.001;
}
