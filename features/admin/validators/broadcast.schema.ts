import { z } from "zod";

/**
 * إرسال إشعار موجَّه من المدير (راجع حالات الاستخدام § "إرسال الاشعارات للمستخدم
 * (جهة، الباحثين عن الفرص، أو كلاهما معًا)").
 */
export const broadcastNotificationSchema = z.object({
  audience: z.enum(["applicants", "organizations", "both"]),
  title: z.string().min(3).max(100),
  body: z.string().min(10).max(1000),
  sendEmail: z.boolean().default(false),
});

export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
