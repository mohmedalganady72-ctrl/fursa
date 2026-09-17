import { pgTable, uuid, text, boolean, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "new_matching_opportunity", // فرصة جديدة تناسب اهتماماته
  "application_status_changed", // تحديث حالة الطلب
  "deadline_approaching", // قرب انتهاء موعد التقديم
  "new_message", // وصول رسالة جديدة
  "profile_update_required", // تحديثات مهمة على الحساب
  "new_applicant", // (للجهة) وصول طلب تقديم جديد
  "account_verified", // (للجهة) اكتمال التحقق من الحساب
  "inactivity_nudge", // رسالة تحفيزية بعد 3 أيام عدم نشاط
  "system_announcement", // إشعارات النظام العامة (صيانة، تحديث، سياسة...)
  "admin_message", // رسالة مباشرة من مدير المنصة
]);

/**
 * سجل إشعارات موحّد لكل الأدوار (باحث/جهة). النوع (type) يحدد كيفية العرض والأيقونة
 * في الواجهة (راجع features/notifications)، والـ linkUrl يوجّه المستخدم عند الضغط على الإشعار.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    linkUrl: text("link_url"), // مثال: /applicant/applications/{id}

    isRead: boolean("is_read").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
