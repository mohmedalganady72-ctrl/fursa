import { z } from "zod";
import { OPPORTUNITY_TYPES, WORK_MODES, OPPORTUNITY_SORT_OPTIONS } from "@/lib/constants";

/** فلاتر صفحة تصفح الفٌرص — تُطبَّق كـ query params (راجع وثيقة المتطلبات § "الفلترة") */
export const opportunityFiltersSchema = z.object({
  type: z.enum([OPPORTUNITY_TYPES.JOB, OPPORTUNITY_TYPES.VOLUNTEERING, OPPORTUNITY_TYPES.CO_OP]).optional(),
  searchQuery: z.string().optional(), // بحث نصي: اسم الجهة / عنوان الفٌرصة / التخصص
  city: z.string().optional(),
  fieldId: z.string().uuid().optional(),
  workMode: z.enum([WORK_MODES.ON_SITE, WORK_MODES.REMOTE, WORK_MODES.HYBRID]).optional(),
  sortBy: z
    .enum([
      OPPORTUNITY_SORT_OPTIONS.BEST_MATCH,
      OPPORTUNITY_SORT_OPTIONS.DEADLINE_SOON,
      OPPORTUNITY_SORT_OPTIONS.LEAST_APPLIED,
      OPPORTUNITY_SORT_OPTIONS.MOST_APPLIED,
      OPPORTUNITY_SORT_OPTIONS.NEWEST,
    ])
    .default(OPPORTUNITY_SORT_OPTIONS.NEWEST),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export type OpportunityFiltersInput = z.infer<typeof opportunityFiltersSchema>;
