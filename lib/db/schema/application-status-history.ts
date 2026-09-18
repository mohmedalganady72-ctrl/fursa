import { pgTable, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { applications, applicationStatusEnum } from "./applications";
import { users } from "./users";

/**
 * سجل تاريخي لكل تغيير في حالة التقديم (راجع وثيقة المتطلبات § 15
 * "يفضل حفظ ApplicationStatusHistory بدل تغيير الحالة فقط"). يُدرَج صف جديد
 * هنا مع كل تحديث لـ applications.status عبر features/applications/services/*
 * — لا تُحدَّث هذه الصفوف أبدًا، فقط تُضاف (append-only) لضمان مصداقية السجل.
 */
export const applicationStatusHistory = pgTable(
  "application_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),

    oldStatus: applicationStatusEnum("old_status"), // NULL عند إنشاء التقديم لأول مرة
    newStatus: applicationStatusEnum("new_status").notNull(),

    // من نفَّذ التغيير — قد يكون المتقدم نفسه (سحب الطلب) أو مستخدم الجهة (قبول/رفض)
    // أو NULL إذا كان التغيير آليًا بالكامل من النظام (إغلاق فٌرصة عند اكتمال المقاعد)
    changedByUserId: uuid("changed_by_user_id").references(() => users.id),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    applicationIdIdx: index("application_status_history_application_id_idx").on(
      table.applicationId
    ),
  })
);

export const applicationStatusHistoryRelations = relations(
  applicationStatusHistory,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationStatusHistory.applicationId],
      references: [applications.id],
    }),
    changedByUser: one(users, {
      fields: [applicationStatusHistory.changedByUserId],
      references: [users.id],
    }),
  })
);

export type ApplicationStatusHistoryEntry = typeof applicationStatusHistory.$inferSelect;
export type NewApplicationStatusHistoryEntry = typeof applicationStatusHistory.$inferInsert;
