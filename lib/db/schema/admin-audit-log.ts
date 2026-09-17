import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { admins } from "./admins";

/**
 * سجل العمليات الإدارية الحساسة (راجع وثيقة المتطلبات § 5.27):
 * اعتماد/رفض جهة، إنشاء مدير جديد، إرسال إشعار جماعي، أي إجراء إداري استثنائي.
 * append-only بنفس منطق application_status_history — لا تُحدَّث الصفوف أبدًا.
 * يُستدعى الإدراج هنا من features/admin/services/*.ts مباشرة بعد كل عملية حساسة.
 */
export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id),

    action: text("action").notNull(), // مثال: "organization_approved", "admin_created", "broadcast_sent"
    targetType: text("target_type"), // مثال: "organization_profile", "user", "admin"
    targetId: uuid("target_id"), // معرّف الكيان المتأثر (لا FK صارم لأنه يشير لجداول متعددة محتملة)
    metadata: jsonb("metadata"), // تفاصيل إضافية حرة حسب نوع العملية (سبب الرفض، عدد المستلمين...)

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    adminIdIdx: index("admin_audit_log_admin_id_idx").on(table.adminId),
    actionIdx: index("admin_audit_log_action_idx").on(table.action),
  })
);

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  admin: one(admins, { fields: [adminAuditLog.adminId], references: [admins.id] }),
}));

export type AdminAuditLogEntry = typeof adminAuditLog.$inferSelect;
export type NewAdminAuditLogEntry = typeof adminAuditLog.$inferInsert;
