import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

/**
 * قائمة المجالات القابلة للاختيار (بيانات مرجعية شبه ثابتة، تُدار من لوحة المدير).
 * تُستخدم في: مجالات الباحث (حتى 5)، ومجالات الفرصة عند الإعلان عنها.
 * جدول مستقل بدل enum ثابت لأن قائمة المجالات قد تحتاج إضافة/تعديل دون نشر كود جديد.
 */
export const fields = pgTable("fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameAr: text("name_ar").notNull().unique(), // مثال: "تطوير البرمجيات"، "التسويق الرقمي"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Field = typeof fields.$inferSelect;
export type NewField = typeof fields.$inferInsert;
