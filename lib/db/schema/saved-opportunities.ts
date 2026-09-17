import { pgTable, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { applicantProfiles } from "./applicant-profiles";
import { opportunities } from "./opportunities";

/**
 * "زر حفظ الفرصة للباحث المسجل" (راجع وثيقة المتطلبات § 5.10) — قائمة اهتمام
 * بسيطة منفصلة تمامًا عن applications (الحفظ لا يعني التقديم).
 */
export const savedOpportunities = pgTable(
  "saved_opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicantProfileId: uuid("applicant_profile_id")
      .notNull()
      .references(() => applicantProfiles.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueSave: uniqueIndex("saved_opportunities_unique_idx").on(
      table.applicantProfileId,
      table.opportunityId
    ),
  })
);

export const savedOpportunitiesRelations = relations(savedOpportunities, ({ one }) => ({
  applicantProfile: one(applicantProfiles, {
    fields: [savedOpportunities.applicantProfileId],
    references: [applicantProfiles.id],
  }),
  opportunity: one(opportunities, {
    fields: [savedOpportunities.opportunityId],
    references: [opportunities.id],
  }),
}));

export type SavedOpportunity = typeof savedOpportunities.$inferSelect;
export type NewSavedOpportunity = typeof savedOpportunities.$inferInsert;
