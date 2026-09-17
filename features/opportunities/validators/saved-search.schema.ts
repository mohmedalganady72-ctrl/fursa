import { z } from "zod";
import { opportunityFiltersSchema } from "./opportunity-filters.schema";

/** حفظ عملية بحث (راجع نموذج البيانات § SavedSearch، الأولوية P2) */
export const savedSearchSchema = z.object({
  label: z.string().min(2, "أعطِ اسمًا واضحًا لهذا البحث").max(80),
  queryText: z.string().optional(),
  filters: opportunityFiltersSchema.partial(), // نسخة جزئية — لا حاجة لكل الحقول وقت الحفظ
});

export type SavedSearchInput = z.infer<typeof savedSearchSchema>;
