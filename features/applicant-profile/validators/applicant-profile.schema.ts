import { z } from "zod";
import { MAX_APPLICANT_FIELDS } from "@/lib/constants";

/** التحقق من بيانات الملف الشخصي — راجع وثيقة المتطلبات § 10.1 لحقول الإدخال الكاملة */
export const applicantProfileSchema = z.object({
  fullName: z.string().min(2, "الاسم قصير جدًا").max(100),
  city: z.string().min(2, "اختر المدينة"),
  bio: z.string().max(500).optional(),
  gender: z.enum(["male", "female"]).optional(),
  qualification: z.string().max(100).optional(),
  specialization: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
  fieldIds: z
    .array(z.string().uuid())
    .max(MAX_APPLICANT_FIELDS, `يمكن اختيار ${MAX_APPLICANT_FIELDS} مجالات كحد أقصى`),
});

export type ApplicantProfileInput = z.infer<typeof applicantProfileSchema>;
