import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizationProfiles } from "./organization-profiles";

export const joinRequestStatusEnum = pgEnum("join_request_status", [
  "pending",
  "approved",
  "rejected",
]);

/**
 * سجل تاريخي لطلبات انضمام الجهات — منفصل عن organization_profiles.isApproved
 * لأنه يحتفظ بسجل قابل للمراجعة (متى قُدِّم الطلب، سبب الرفض إن وُجد) حتى بعد اتخاذ القرار،
 * بينما isApproved في organization_profiles يعكس الحالة الحالية فقط.
 */
export const organizationJoinRequests = pgTable("organization_join_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationProfileId: uuid("organization_profile_id")
    .notNull()
    .references(() => organizationProfiles.id, { onDelete: "cascade" }),

  status: joinRequestStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),

  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const organizationJoinRequestsRelations = relations(
  organizationJoinRequests,
  ({ one }) => ({
    organizationProfile: one(organizationProfiles, {
      fields: [organizationJoinRequests.organizationProfileId],
      references: [organizationProfiles.id],
    }),
  })
);

export type OrganizationJoinRequest = typeof organizationJoinRequests.$inferSelect;
export type NewOrganizationJoinRequest = typeof organizationJoinRequests.$inferInsert;
