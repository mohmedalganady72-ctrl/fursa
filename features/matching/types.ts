import type { OpportunityType } from "@/lib/constants";

/**
 * صورة مبسّطة من بيانات الباحث اللازمة لحساب التوافق — تُبنى في applications.service.ts
 * من applicantProfiles + applicantFields + بيانات CV المُستخرجة (إن وُجدت)،
 * وتُمرَّر لمحرك الحساب بمعزل عن تفاصيل قاعدة البيانات (فصل الاهتمامات).
 */
export interface ApplicantMatchProfile {
  fieldIds: string[];
  city: string;
  gender: "male" | "female" | null;
  bio: string | null;
  qualification: string | null;
  specialization: string | null;
  university: string | null;
  academicLevel: string | null;
  major: string | null;
  // مهارات وخبرات مدمجة من الملف الشخصي + السيرة الذاتية المُحلَّلة (راجع cv-parsing)
  skills: string[];
  yearsOfExperience: number | null;
}

/** صورة مبسّطة من متطلبات الفٌرصة اللازمة للمقارنة */
export interface OpportunityMatchCriteria {
  type: OpportunityType;
  fieldIds: string[];
  city: string;
  genderRequirement: "male" | "female" | null;
  requiredQualification: string | null;
  requiredSkills: string[];
  requiredUniversity: string | null;
  requiredAcademicLevel: string | null;
  /** الحد الأدنى لسنوات الخبرة المطلوبة لفٌرص العمل — null أو 0 يعني "غير مشترط" */
  minimumYearsExperience: number | null;
}

/** ناتج الحساب — الدرجة الكلية + تفصيل كل معيار على حدة (يُستخدم في شرح الدرجة للجهة لاحقًا) */
export interface MatchScoreResult {
  totalScore: number; // 0-100
  breakdown: Record<string, number>; // كل معيار ونسبة تحققه (0-1) قبل الضرب بالوزن
}
