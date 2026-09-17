import { z } from "zod";

/** تبليغ عن محتوى مخالف (راجع وثيقة المتطلبات § 5.17: "آلية تبليغ عن الرسائل المخالفة") */
export const reportSchema = z.object({
  targetType: z.enum(["message", "user", "opportunity"]),
  targetId: z.string().uuid(),
  reason: z.string().min(10, "الرجاء توضيح سبب التبليغ").max(500),
});

export type ReportInput = z.infer<typeof reportSchema>;
