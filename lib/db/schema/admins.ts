import { pgTable, uuid, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

/**
 * حسابات مديري المنصة — علاقة 1:1 مع users (role = 'admin').
 * منفصل عن applicant/organization profiles لأن بيانات المدير مختلفة تمامًا
 * (لا ملف عام، لا صورة شخصية معروضة للجمهور، فقط اسم للعرض الداخلي).
 */
export const admins = pgTable(
  "admins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    displayName: text("display_name").notNull(),

    // يسجّل أي مدير أنشأ هذا الحساب (المدير الأول يُنشأ يدويًا عبر seed، الباقي من داخل لوحة التحكم)
    createdByAdminId: uuid("created_by_admin_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdUnique: uniqueIndex("admins_user_id_idx").on(table.userId),
  })
);

export const adminsRelations = relations(admins, ({ one }) => ({
  user: one(users, { fields: [admins.userId], references: [users.id] }),
}));

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
