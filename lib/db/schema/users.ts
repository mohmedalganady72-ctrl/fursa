// import { pgTable, uuid, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

// // دور الحساب — يحدد أي لوحة (applicant/organization/admin) يصل لها المستخدم بعد الدخول
// export const userRoleEnum = pgEnum("user_role", ["applicant", "organization", "admin"]);

// /**
//  * الجدول الأساسي المشترك لكل الحسابات بغضّ النظر عن الدور.
//  * البيانات التفصيلية الخاصة بكل دور (اسم، صورة، تخصص...) تعيش في جداول منفصلة
//  * (applicant_profiles / organization_profiles / admins) مربوطة بـ user.id.
//  * هذا الفصل يبقي جدول المصادقة نظيفًا ومستقلًا عن بيانات الملف الشخصي المتغيّرة.
//  */
// export const users = pgTable("users", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   email: text("email").notNull().unique(),
//   // كلمة المرور المشفّرة — Better Auth يدير هذا الحقل فعليًا عبر جدول account الخاص به،
//   // هذا العمود موجود هنا فقط لو احتجنا الوصول المباشر لأغراض إدارية عبر Drizzle
//   hashedPassword: text("hashed_password"),

//   role: userRoleEnum("role").notNull(),

//   // التحقق من البريد عبر كود يُرسَل بعد التسجيل (راجع حالات الاستخدام § 2)
//   emailVerified: boolean("email_verified").notNull().default(false),

//   // حساب الجهة تحديدًا لا يُفعَّل إلا بعد موافقة المدير (راجع حالات الاستخدام § 2)
//   // للباحث والمدير تكون القيمة true تلقائيًا فور التحقق من البريد
//   isActive: boolean("is_active").notNull().default(false),

//   createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

//   // آخر وقت دخول — يُستخدم في مهمة pg_cron الخاصة بالتنبيه السلوكي بعد 3 أيام عدم نشاط
//   lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
// });

// export type User = typeof users.$inferSelect;
// export type NewUser = typeof users.$inferInsert;


import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// دور الحساب — يحدد أي لوحة يصل لها المستخدم
export const userRoleEnum = pgEnum("user_role", [
  "applicant",
  "organization",
  "admin",
]);

/**
 * جدول المستخدم الأساسي.
 *
 * هذا الجدول موجود مسبقًا في قاعدة البيانات باسم `users`
 * وتوجد عليه علاقات كثيرة من بقية جداول المنصة.
 *
 * Better Auth سيستخدم هذا الجدول مباشرة عبر:
 * user.modelName = "users"
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  // حقول Better Auth الأساسية
  name: text("name").notNull().default(""),
  email: text("email").notNull().unique(),
  image: text("image"),

  emailVerified: boolean("email_verified").notNull().default(false),

  // حقول المنصة الخاصة
  role: userRoleEnum("role").notNull(),

  isActive: boolean("is_active").notNull().default(false),
  isRestricted: boolean("is_restricted").notNull().default(false),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  lastLoginAt: timestamp("last_login_at", {
    withTimezone: true,
  }),
  inactivityNotificationsEnabled: boolean("inactivity_notifications_enabled").notNull().default(true),
  lastInactivityNudgeAt: timestamp("last_inactivity_nudge_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
