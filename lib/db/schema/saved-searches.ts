import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { applicantProfiles } from "./applicant-profiles";

/**
 * عمليات بحث محفوظة (راجع وثيقة المتطلبات، الأولوية P2). تُخزَّن معايير الفلترة
 * كـ JSON حر بدل أعمدة صريحة، لأن مجموعة الفلاتر قابلة للتوسع مستقبلًا
 * (راجع features/opportunities/validators/opportunity-filters.schema.ts) دون
 * الحاجة لترحيل قاعدة بيانات جديد في كل مرة تُضاف فيها خاصية فلترة جديدة.
 */
export const savedSearches = pgTable("saved_searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantProfileId: uuid("applicant_profile_id")
    .notNull()
    .references(() => applicantProfiles.id, { onDelete: "cascade" }),

  label: text("label").notNull(), // اسم يختاره المستخدم للبحث المحفوظ
  queryText: text("query_text"), // نص البحث الحر إن وُجد
  filters: jsonb("filters").notNull(), // نسخة من OpportunityFiltersInput وقت الحفظ

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  applicantProfile: one(applicantProfiles, {
    fields: [savedSearches.applicantProfileId],
    references: [applicantProfiles.id],
  }),
}));

export type SavedSearch = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;
