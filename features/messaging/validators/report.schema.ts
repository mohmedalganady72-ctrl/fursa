import { z } from "zod";

/** تبليغ عن محتوى مخالف (راجع وثيقة المتطلبات § 5.17: "آلية تبليغ عن الرسائل المخالفة") */
export const reportSchema = z.object({
  targetType: z.enum(["message", "user", "opportunity"]),
  targetId: z.string().uuid(),
  reason: z.string().min(10, "وضّح سبب البلاغ في 10 أحرف على الأقل").max(500),
});

export type ReportInput = z.infer<typeof reportSchema>;
