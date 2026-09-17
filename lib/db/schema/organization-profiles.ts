import { pgTable, uuid, text, timestamp, pgEnum, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const organizationTypeEnum = pgEnum("organization_type", [
  "company", // شركة
  "nonprofit", // منظمة تطوعية / غير ربحية
  "academic", // مؤسسة أكاديمية
  "government", // جهة حكومية
]);

/**
 * الملف التعريفي للجهة — علاقة 1:1 مع users.
 * isApproved منفصل عن users.isActive: isActive يتحكم بإمكانية الدخول عمومًا،
 * بينما isApproved يعكس تحديدًا قرار مدير المنصة (راجع حالات الاستخدام § 2 و§10).
 */
export const organizationProfiles = pgTable(
  "organization_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    organizationType: organizationTypeEnum("organization_type").notNull(),
    city: text("city").notNull(),
    activityDescription: text("activity_description"), // وصف النشاط

    isApproved: boolean("is_approved").notNull().default(false),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedByAdminId: uuid("approved_by_admin_id"), // مرجع إلى admins.id (يُضاف كـ FK بعد تعريف admins)

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdUnique: uniqueIndex("organization_profiles_user_id_idx").on(table.userId),
  })
);

export const organizationProfilesRelations = relations(organizationProfiles, ({ one }) => ({
  user: one(users, { fields: [organizationProfiles.userId], references: [users.id] }),
}));

export type OrganizationProfile = typeof organizationProfiles.$inferSelect;
export type NewOrganizationProfile = typeof organizationProfiles.$inferInsert;
