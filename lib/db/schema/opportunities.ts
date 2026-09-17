import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { organizationProfiles } from "./organization-profiles";
import { fields } from "./fields";

export const opportunityTypeEnum = pgEnum("opportunity_type", [
  "job",
  "volunteering",
  "co_op",
]);

export const workModeEnum = pgEnum("work_mode", ["on_site", "remote", "hybrid"]);

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "draft", // مسودة قبل النشر (معاينة — راجع وثيقة المتطلبات § 5.6)
  "published", // منشورة ومفتوحة للتقديم
  "closed", // أُغلقت فور اكتمال المقاعد المطلوب قبولها، أو إغلاق يدوي استثنائي من المدير
  "expired", // انتهى تاريخ آخر موعد للتقديم دون اكتمال المقاعد
]);

/**
 * جدول الفرص الموحّد للأنواع الثلاثة (عمل / تطوع / تدريب تعاوني).
 * القرار: جدول واحد بحقول مشتركة + حقول خاصة قابلة للـ NULL حسب النوع،
 * بدل ثلاثة جداول منفصلة — لأن معظم منطق العرض والبحث والفلترة مشترك،
 * والحقول الخاصة بكل نوع قليلة العدد (راجع وثيقة المتطلبات § 10.4).
 * الفرق بين الأنواع في التحقق من صحة الإدخال يُدار في features/opportunities/validators
 * عبر Zod discriminated union، وليس بقيود صارمة على مستوى قاعدة البيانات.
 */
export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationProfileId: uuid("organization_profile_id")
      .notNull()
      .references(() => organizationProfiles.id, { onDelete: "cascade" }),

    type: opportunityTypeEnum("type").notNull(),
    status: opportunityStatusEnum("status").notNull().default("published"),

    // ===== حقول مشتركة لكل الأنواع الثلاثة =====
    title: text("title").notNull(),
    description: text("description").notNull(),
    workMode: workModeEnum("work_mode").notNull(),
    city: text("city").notNull(),
    seatsAvailable: integer("seats_available").notNull().default(1),
    seatsFilled: integer("seats_filled").notNull().default(0),

    applicationStartAt: timestamp("application_start_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    applicationDeadline: timestamp("application_deadline", { withTimezone: true }).notNull(),

    // ===== حقول خاصة بفرص العمل =====
    requiredQualification: text("required_qualification"), // المؤهل المطلوب
    requiredSkills: text("required_skills"), // نص حر مفصول بفواصل، يُستخدم في خوارزمية التوافق
    minimumYearsExperience: integer("minimum_years_experience"), // NULL = غير مشترط (راجع features/matching)

    // ===== حقول خاصة بالتدريب التعاوني =====
    requiredAcademicLevel: text("required_academic_level"), // المستوى الدراسي المطلوب
    requiredUniversity: text("required_university"), // جامعة محددة إن وُجد شرط، أو NULL لأي جامعة

    // ===== حقول خاصة بالتطوع =====
    requiresResume: text("requires_resume"), // 'true' | 'false' كنص (يُنسَّق لاحقًا كـ boolean عبر Zod)
    genderRequirement: text("gender_requirement"), // 'male' | 'female' | NULL لعدم الاشتراط

    // تاريخ النشر الفعلي — يُستخدم للترتيب الزمني (الأحدث أولًا) ولحساب اتجاه النشر بمرور الوقت
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    // لا يوجد تعديل بعد النشر إطلاقًا في هذا الإصدار (راجع وثيقة المتطلبات § 5.7) —
    // هذا العمود محذوف عمدًا؛ أي "تعديل" فعليًا هو إغلاق هذه الفرصة + إنشاء فرصة جديدة.
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closureReason: text("closure_reason"), // "seats_filled" | "expired" | "admin_action" | إلخ (نص حر توثيقي)

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // فهارس على الحقول الأكثر استخدامًا في الفلترة والترتيب (راجع design لاحقًا لقياس الأداء الفعلي)
    typeIdx: index("opportunities_type_idx").on(table.type),
    statusIdx: index("opportunities_status_idx").on(table.status),
    cityIdx: index("opportunities_city_idx").on(table.city),
    deadlineIdx: index("opportunities_deadline_idx").on(table.applicationDeadline),
    createdAtIdx: index("opportunities_created_at_idx").on(table.createdAt),
  })
);

/** جدول ربط many-to-many بين الفرصة والمجالات المطلوبة لها */
export const opportunityFields = pgTable("opportunity_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  opportunityId: uuid("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  fieldId: uuid("field_id")
    .notNull()
    .references(() => fields.id, { onDelete: "cascade" }),
});

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  organizationProfile: one(organizationProfiles, {
    fields: [opportunities.organizationProfileId],
    references: [organizationProfiles.id],
  }),
  opportunityFields: many(opportunityFields),
}));

export const opportunityFieldsRelations = relations(opportunityFields, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [opportunityFields.opportunityId],
    references: [opportunities.id],
  }),
  field: one(fields, { fields: [opportunityFields.fieldId], references: [fields.id] }),
}));

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
