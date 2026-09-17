import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { opportunities } from "./opportunities";
import { applicantProfiles } from "./applicant-profiles";

/**
 * حالات التقديم وفق وثيقة المتطلبات المحدَّثة § 5.13. لا توجد حالة "بانتظار رد
 * خلال 24 ساعة" في هذا الإصدار — القبول فوري ونهائي (راجع قرارات § 14:
 * "لا توجد سياسة قبول لمدة 24 ساعة، ولا يسقط القبول تلقائيًا").
 */
export const applicationStatusEnum = pgEnum("application_status", [
  "applied", // تم إرسال الطلب بنجاح
  "under_review", // الجهة تراجع الطلب
  "shortlisted", // تم اختيار المتقدم مبدئيًا (اختياري، قبل القبول النهائي)
  "accepted", // تم قبول المتقدم نهائيًا
  "rejected", // تم رفض الطلب
  "withdrawn", // سحب الباحث طلبه بنفسه
  "closed", // أُغلقت الفرصة قبل البتّ في هذا الطلب تحديدًا
]);

/**
 * تقديمات الباحثين على الفرص. حقول التقديم الإضافية (لماذا أنت مناسب / الرقم الأكاديمي...)
 * تختلف حسب نوع الفرصة (راجع وثيقة المتطلبات § 5.11) — تُخزَّن هنا كحقول قابلة للـ NULL
 * بنفس منطق جدول opportunities، بدل جداول تقديم منفصلة لكل نوع.
 */
export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    applicantProfileId: uuid("applicant_profile_id")
      .notNull()
      .references(() => applicantProfiles.id, { onDelete: "cascade" }),

    status: applicationStatusEnum("status").notNull().default("applied"),

    // ===== خاص بفرص العمل =====
    whySuitableText: text("why_suitable_text"), // "لماذا أنت مناسب لهذه الوظيفة؟"

    // ===== خاص بالتدريب التعاوني =====
    academicId: text("academic_id"), // الرقم الأكاديمي
    academicLevel: text("academic_level"), // المستوى الدراسي وقت التقديم
    university: text("university"),
    major: text("major"), // التخصص وقت التقديم

    // سيرة ذاتية مرفقة خاصة بهذا التقديم (قد تختلف عن سيرة الملف الشخصي الافتراضية)
    resumeUrl: text("resume_url"),

    // ===== درجة التوافق المحسوبة (راجع features/matching/services/scoring-engine.ts) =====
    // تُخزَّن وقت التقديم بدل حسابها في كل طلب عرض — أداء أفضل لقوائم طويلة.
    // تُحفَظ أيضًا الأوزان المستخدمة وقت الحساب (raw JSON) امتثالًا لوثيقة المتطلبات § 5.16
    // ("حفظ نسخة من الأوزان المستخدمة عند تقييم الطلب") لضمان قابلية تفسير الدرجة لاحقًا
    // حتى لو تغيّرت الأوزان الافتراضية في النظام بعد ذلك.
    compatibilityScore: integer("compatibility_score"), // 0-100
    compatibilityBreakdown: text("compatibility_breakdown"), // JSON.stringify لتفصيل كل معيار ووزنه وقت الحساب

    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),

    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // يمنع تقديم الباحث نفسه على نفس الفرصة أكثر من مرة (راجع § 3 قاعدة 8)
    uniqueApplication: uniqueIndex("applications_unique_idx").on(
      table.opportunityId,
      table.applicantProfileId
    ),
    statusIdx: index("applications_status_idx").on(table.status),
  })
);

export const applicationsRelations = relations(applications, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [applications.opportunityId],
    references: [opportunities.id],
  }),
  applicantProfile: one(applicantProfiles, {
    fields: [applications.applicantProfileId],
    references: [applicantProfiles.id],
  }),
  // لا نُعرِّف علاقة "statusHistory" من هذا الطرف عمدًا — استيراد application-status-history.ts
  // هنا كان سيُنشئ حلقة استيراد دائرية (applications.ts ↔ application-status-history.ts).
  // العلاقة معرَّفة بالكامل من الطرف الآخر (application-status-history.ts)، وهذا كافٍ
  // لعمل with: { statusHistory: true } عند الاستعلام من applicationStatusHistory مباشرة؛
  // للوصول من application إلى سجلّاته التاريخية، استعلم عن applicationStatusHistory
  // بشرط applicationId بدل الاعتماد على with المتداخل من هذا الطرف.
}));

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
