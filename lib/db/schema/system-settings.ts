import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * إعدادات النظام القابلة للتعديل دون نشر كود جديد (راجع وثيقة المتطلبات § 5.12:
 * "يجب أن يكون الحد اليومي للتقديم قابلًا للإعداد من النظام" و§ 15: "يجب جعل
 * إعدادات مثل حد التقديم وأوزان المطابقة قابلة للتعديل دون تعديل الكود").
 * جدول key-value بسيط بدل أعمدة صريحة لكل إعداد — يسمح بإضافة إعدادات جديدة
 * مستقبلًا (مثل أوزان المطابقة القابلة للتعديل، المذكورة في § 5.16) دون ترحيل جديد.
 */
export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(), // مثال: "daily_application_limit_per_type"
  value: jsonb("value").notNull(),
  description: text("description"), // شرح مختصر للإعداد يظهر في لوحة المدير
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
