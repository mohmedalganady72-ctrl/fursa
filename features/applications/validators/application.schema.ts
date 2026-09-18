import { z } from "zod";
import { OPPORTUNITY_TYPES } from "@/lib/constants";

/**
 * التحقق من بيانات التقديم — يختلف حسب نوع الفٌرصة (راجع وثيقة المتطلبات § 10.3).
 * discriminated union بنفس نمط opportunity.schema.ts للسبب نفسه: أمان نوعي كامل.
 */

const jobApplicationSchema = z.object({
  opportunityType: z.literal(OPPORTUNITY_TYPES.JOB),
  opportunityId: z.string().uuid(),
  whySuitableText: z.string().min(30, "اكتب نصًا لا يقل عن 30 حرفًا").max(1500),
  resumeUrl: z.string().min(1, "السيرة الذاتية مطلوبة لفٌرص العمل"),
});

const volunteeringApplicationSchema = z.object({
  opportunityType: z.literal(OPPORTUNITY_TYPES.VOLUNTEERING),
  opportunityId: z.string().uuid(),
  resumeUrl: z.string().optional(), // مطلوبة فقط إذا حدّدت الجهة ذلك في الفٌرصة (يُتحقَّق منه في service)
});

const coOpApplicationSchema = z.object({
  opportunityType: z.literal(OPPORTUNITY_TYPES.CO_OP),
  opportunityId: z.string().uuid(),
  academicId: z.string().min(3, "الرقم الأكاديمي مطلوب"),
  academicLevel: z.string().min(1, "المستوى الدراسي مطلوب"),
  university: z.string().min(2, "اسم الجامعة مطلوب"),
  major: z.string().min(2, "التخصص مطلوب"),
});

export const applicationSchema = z.discriminatedUnion("opportunityType", [
  jobApplicationSchema,
  volunteeringApplicationSchema,
  coOpApplicationSchema,
]);

export type ApplicationInput = z.infer<typeof applicationSchema>;

/** رد الجهة على تقديم: قبول أو رفض */
export const applicationDecisionSchema = z.object({
  applicationId: z.string().uuid(),
  decision: z.enum(["accept", "reject"]),
});
