import { z } from "zod";
import { OPPORTUNITY_TYPES, WORK_MODES } from "@/lib/constants";

/**
 * نموذج إعلان الفٌرصة موحّد الواجهة (راجع وثيقة المتطلبات § 10.4)، لكن التحقق من الصحة
 * يستخدم Zod discriminated union حسب النوع — كل نوع له حقوله الإجبارية الخاصة،
 * بدل حقل واحد "any" يضعف الأمان النوعي (type safety) في بقية الكود.
 */

const baseFields = {
  title: z.string().min(5, "العنوان قصير جدًا").max(120),
  description: z.string().min(20, "الوصف قصير جدًا").max(3000),
  workMode: z.enum([WORK_MODES.ON_SITE, WORK_MODES.REMOTE, WORK_MODES.HYBRID]),
  city: z.string().min(2),
  seatsAvailable: z.number().int().min(1),
  applicationDeadline: z.coerce.date().refine((d) => d > new Date(), {
    message: "يجب أن يكون موعد انتهاء التقديم في المستقبل",
  }),
  fieldIds: z.array(z.string().uuid()).min(1, "اختر مجالًا واحدًا على الأقل"),
};

const jobOpportunitySchema = z.object({
  ...baseFields,
  type: z.literal(OPPORTUNITY_TYPES.JOB),
  requiredQualification: z.string().min(2),
  requiredSkills: z.array(z.string()).min(1, "أضف مهارة واحدة على الأقل"),
  minimumYearsExperience: z.number().int().min(0).nullable(),
});

const volunteeringOpportunitySchema = z.object({
  ...baseFields,
  type: z.literal(OPPORTUNITY_TYPES.VOLUNTEERING),
  requiresResume: z.boolean(),
  genderRequirement: z.enum(["male", "female"]).nullable(),
});

const coOpOpportunitySchema = z.object({
  ...baseFields,
  type: z.literal(OPPORTUNITY_TYPES.CO_OP),
  requiredAcademicLevel: z.string().min(2),
  requiredUniversity: z.string().nullable(), // null = مفتوحة لأي جامعة
});

export const opportunitySchema = z.discriminatedUnion("type", [
  jobOpportunitySchema,
  volunteeringOpportunitySchema,
  coOpOpportunitySchema,
]);

export type OpportunityInput = z.infer<typeof opportunitySchema>;

// لا يوجد schema منفصل للتعديل — الفٌرص لا تُعدَّل بعد النشر في هذا الإصدار
// (راجع وثيقة المتطلبات § 5.7). نموذج "الاستبدال" يستخدم opportunitySchema نفسه كاملًا
// (راجع app/api/opportunities/[opportunityId]/replace/route.ts).
