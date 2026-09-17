import { pgTable, uuid, text, pgEnum, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const reportTargetTypeEnum = pgEnum("report_target_type", ["message", "user", "opportunity"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "reviewed", "dismissed"]);

/**
 * آلية تبليغ عن محتوى مخالف (راجع وثيقة المتطلبات § 5.17: "يجب توفير آلية تبليغ
 * عن الرسائل المخالفة"). عامة بما يكفي (targetType) لتغطية الإبلاغ عن رسالة،
 * مستخدم، أو فٌرصة لاحقًا دون تغيير البنية.
 */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id),

    targetType: reportTargetTypeEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(), // لا FK صارم لتعدد الجداول المستهدَفة المحتملة
    reason: text("reason").notNull(),

    status: reportStatusEnum("status").notNull().default("pending"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("reports_status_idx").on(table.status),
  })
);

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, { fields: [reports.reporterId], references: [users.id] }),
}));

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
