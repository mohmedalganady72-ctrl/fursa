import { z } from "zod";

export const organizationProfileSchema = z.object({
  name: z.string().min(2, "اسم الجهة قصير جدًا").max(150),
  organizationType: z.enum(["company", "nonprofit", "academic", "government"]),
  city: z.string().min(2, "اختر المدينة"),
  activityDescription: z.string().max(1000).optional(),
  logoUrl: z.string().url().optional(),
});

export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>;
