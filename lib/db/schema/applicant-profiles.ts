import { pgTable, uuid, text, timestamp, pgEnum, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { fields } from "./fields";

export const genderEnum = pgEnum("gender", ["male", "female"]);

/**
 * الملف الشخصي للباحث عن فرصة — علاقة 1:1 مع users عبر userId (فريد).
 * راجع وثيقة المتطلبات § 5.3 لحقول الإدخال الكاملة (نسخة موسَّعة عن الإصدار الأول
 * تضيف: الجامعة، المستوى الدراسي، المهارات، الخبرات، الدورات، اللغات، الروابط الخارجية).
 */
export const applicantProfiles = pgTable(
  "applicant_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"), // مسار في Supabase Storage
    city: text("city").notNull(),
    bio: text("bio"), // "وصف ونبذة عن الباحث"
    gender: genderEnum("gender"),

    // بيانات أكاديمية ومهنية — تُستخدم في البحث الذكي وحساب درجة التوافق
    qualification: text("qualification"), // المؤهل العلمي (بكالوريوس، دبلوم...)
    university: text("university"),
    specialization: text("specialization"), // التخصص الدقيق كنص حر (يُستخرج أيضًا من CV)
    academicLevel: text("academic_level"), // المستوى الدراسي (لطلاب التدريب التعاوني تحديدًا)

    // حقول بنيوية جديدة (راجع وثيقة المتطلبات § 5.3) — تُخزَّن كـ JSON array من نصوص
    // بدل جداول ربط منفصلة لكل حقل، لأنها بيانات حرة الشكل يُدخلها المستخدم مباشرة
    // (بخلاف "المجالات" التي تبقى قائمة مرجعية مغلقة تستحق جدول ربط فعلي أدناه)
    skills: jsonb("skills").$type<string[]>().default([]),
    experiences: jsonb("experiences").$type<string[]>().default([]), // أوصاف خبرات سابقة كنصوص حرة
    certifications: jsonb("certifications").$type<string[]>().default([]), // الدورات والشهادات
    languages: jsonb("languages").$type<string[]>().default([]),

    linkedinUrl: text("linkedin_url"),
    githubUrl: text("github_url"),
    portfolioUrl: text("portfolio_url"), // رابط أعمال عام إن وُجد

    resumeUrl: text("resume_url"), // آخر سيرة ذاتية مرفوعة (PDF في Supabase Storage)
    resumeParsedAt: timestamp("resume_parsed_at", { withTimezone: true }), // آخر مرة حُلِّلت فيها السيرة عبر LLM
    parsedResume: jsonb("parsed_resume").$type<{
      skills: string[]; yearsOfExperience: number | null; qualification: string | null;
      specialization: string | null; previousJobTitles: string[]; rawTextLength: number;
    }>(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // كل مستخدم له ملف شخصي واحد فقط
    userIdUnique: uniqueIndex("applicant_profiles_user_id_idx").on(table.userId),
  })
);

/**
 * جدول ربط many-to-many بين الباحث والمجالات — يفرض الحد الأقصى (5 مجالات)
 * على مستوى منطق التطبيق (features/applicant-profile/validators) وليس على مستوى قاعدة البيانات،
 * لأن قيود العدّ المعقدة أوضح وأسهل صيانة في طبقة التطبيق.
 */
export const applicantFields = pgTable("applicant_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantProfileId: uuid("applicant_profile_id")
    .notNull()
    .references(() => applicantProfiles.id, { onDelete: "cascade" }),
  fieldId: uuid("field_id")
    .notNull()
    .references(() => fields.id, { onDelete: "cascade" }),
});

export const applicantProfilesRelations = relations(applicantProfiles, ({ one, many }) => ({
  user: one(users, { fields: [applicantProfiles.userId], references: [users.id] }),
  applicantFields: many(applicantFields),
}));

export const applicantFieldsRelations = relations(applicantFields, ({ one }) => ({
  applicantProfile: one(applicantProfiles, {
    fields: [applicantFields.applicantProfileId],
    references: [applicantProfiles.id],
  }),
  field: one(fields, { fields: [applicantFields.fieldId], references: [fields.id] }),
}));

export type ApplicantProfile = typeof applicantProfiles.$inferSelect;
export type NewApplicantProfile = typeof applicantProfiles.$inferInsert;
