import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "@/features/matching/services/scoring-engine";
import { assertWeightsSumToOne, JOB_WEIGHTS, VOLUNTEERING_WEIGHTS, CO_OP_WEIGHTS } from "@/features/matching/services/scoring-weights";
import { OPPORTUNITY_TYPES } from "@/lib/constants";
import type { ApplicantMatchProfile, OpportunityMatchCriteria } from "@/features/matching/types";

describe("جداول الأوزان", () => {
  it("مجموع أوزان كل نوع فرصة يساوي 1 تمامًا", () => {
    expect(assertWeightsSumToOne(JOB_WEIGHTS)).toBe(true);
    expect(assertWeightsSumToOne(VOLUNTEERING_WEIGHTS)).toBe(true);
    expect(assertWeightsSumToOne(CO_OP_WEIGHTS)).toBe(true);
  });
});

describe("محرك حساب التوافق — فرص العمل", () => {
  const baseCriteria: OpportunityMatchCriteria = {
    type: OPPORTUNITY_TYPES.JOB,
    fieldIds: ["field-1"],
    city: "صنعاء",
    genderRequirement: null,
    requiredQualification: "بكالوريوس",
    requiredSkills: ["React", "TypeScript"],
    requiredUniversity: null,
    requiredAcademicLevel: null,
    minimumYearsExperience: 2,
  };

  it("يُرجع درجة مرتفعة عند تطابق كل المعايير تقريبًا", () => {
    const applicant: ApplicantMatchProfile = {
      fieldIds: ["field-1"],
      city: "صنعاء",
      gender: "male",
      bio: null,
      qualification: "بكالوريوس",
      specialization: "تطوير الويب",
      university: null,
      academicLevel: null,
      major: null,
      skills: ["React", "TypeScript", "Node.js"],
      yearsOfExperience: 3,
    };

    const result = calculateMatchScore(applicant, baseCriteria);
    expect(result.totalScore).toBeGreaterThan(70);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  it("يُرجع درجة منخفضة عند غياب كل المعايير المطلوبة", () => {
    const applicant: ApplicantMatchProfile = {
      fieldIds: [],
      city: "عدن",
      gender: "female",
      bio: null,
      qualification: "دبلوم",
      specialization: null,
      university: null,
      academicLevel: null,
      major: null,
      skills: [],
      yearsOfExperience: null,
    };

    const result = calculateMatchScore(applicant, baseCriteria);
    expect(result.totalScore).toBeLessThan(20);
  });

  it("الدرجة الكلية دائمًا بين 0 و100 مهما كانت المدخلات", () => {
    const extremeApplicant: ApplicantMatchProfile = {
      fieldIds: ["field-1", "field-2", "field-3"],
      city: "صنعاء",
      gender: "male",
      bio: "نص طويل جدًا ".repeat(50),
      qualification: "بكالوريوس",
      specialization: "تطوير الويب المتقدم",
      university: null,
      academicLevel: null,
      major: null,
      skills: ["React", "TypeScript", "Node.js", "Python", "Go", "Rust"],
      yearsOfExperience: 15,
    };

    const result = calculateMatchScore(extremeApplicant, baseCriteria);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });
});

describe("محرك حساب التوافق — التطوع (شرط الجنس)", () => {
  it("لا يُطبَّق معيار الجنس إذا لم تشترطه الفرصة", () => {
    const criteriaNoGenderReq: OpportunityMatchCriteria = {
      type: OPPORTUNITY_TYPES.VOLUNTEERING,
      fieldIds: ["field-1"],
      city: "صنعاء",
      genderRequirement: null,
      requiredQualification: null,
      requiredSkills: [],
      requiredUniversity: null,
      requiredAcademicLevel: null,
      minimumYearsExperience: null,
    };

    const applicant: ApplicantMatchProfile = {
      fieldIds: ["field-1"],
      city: "صنعاء",
      gender: "female",
      bio: "متطوعة نشطة في المجتمع",
      qualification: null,
      specialization: null,
      university: null,
      academicLevel: null,
      major: null,
      skills: [],
      yearsOfExperience: null,
    };

    const result = calculateMatchScore(applicant, criteriaNoGenderReq);
    // معيار الجنس محقَّق تلقائيًا (1) رغم عدم تحديد جنس الفرصة — يجب ألا يُخفِّض الدرجة
    expect(result.breakdown.gender).toBe(1);
  });
});
