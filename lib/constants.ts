/**
 * ثوابت مشتركة عبر المشروع كامل — أي قيمة تتكرر في أكثر من ميزة يجب أن تُعرَّف هنا
 * مرة واحدة بدل تكرارها كنص حرفي (magic string) في عدة ملفات.
 */

// ============ أنواع الفٌرص الثلاثة ============
export const OPPORTUNITY_TYPES = {
  JOB: "job",
  VOLUNTEERING: "volunteering",
  CO_OP: "co_op",
} as const;

export type OpportunityType =
  (typeof OPPORTUNITY_TYPES)[keyof typeof OPPORTUNITY_TYPES];

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  job: "وظيفة",
  volunteering: "تطوع",
  co_op: "تدريب تعاوني",
};

// ============ حالات الفٌرصة (راجع وثيقة المتطلبات § 7.2) ============
export const OPPORTUNITY_STATUS = {
  DRAFT: "draft", // مسودة قبل النشر (معاينة الفٌرصة — § 5.6)
  PUBLISHED: "published", // منشورة ومفتوحة للتقديم
  CLOSED: "closed", // أُغلقت يدويًا أو تلقائيًا فور اكتمال المقاعد المقبولة
  EXPIRED: "expired", // انتهى تاريخ آخر موعد للتقديم دون اكتمال المقاعد
} as const;

export type OpportunityStatus =
  (typeof OPPORTUNITY_STATUS)[keyof typeof OPPORTUNITY_STATUS];

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  draft: "مسودة",
  published: "منشورة",
  closed: "مغلقة",
  expired: "منتهية",
};

// ============ حالات التقديم (وفق وثيقة المتطلبات المحدَّثة § 5.13) ============
export const APPLICATION_STATUS = {
  APPLIED: "applied", // تم إرسال الطلب بنجاح
  UNDER_REVIEW: "under_review", // الجهة تراجع الطلب
  SHORTLISTED: "shortlisted", // تم اختيار المتقدم مبدئيًا
  ACCEPTED: "accepted", // تم قبول المتقدم
  REJECTED: "rejected", // تم رفض الطلب
  WITHDRAWN: "withdrawn", // سحب الباحث طلبه (إذا كانت الخاصية مفعَّلة)
  CLOSED: "closed", // أُغلقت الفٌرصة وأُوقف استقبال الطلبات — الطلب لم يُبتّ فيه وقت الإغلاق
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "تم التقديم",
  under_review: "قيد المراجعة",
  shortlisted: "مُرشَّح مبدئيًا",
  accepted: "مقبول",
  rejected: "غير مقبول",
  withdrawn: "مسحوب",
  closed: "أُغلقت الفٌرصة",
};

/**
 * لا توجد مهلة قبول 24 ساعة في هذا الإصدار (راجع قرارات § 14 في وثيقة المتطلبات
 * المحدَّثة: "لا توجد سياسة قبول لمدة 24 ساعة، ولا يسقط القبول تلقائيًا").
 * القبول فوري ونهائي؛ إغلاق الفٌرصة يحدث فور اكتمال المقاعد المطلوبة
 * (راجع features/applications/services/acceptance-lifecycle.ts).
 */

// عدد أيام عدم النشاط قبل إرسال إشعار تحفيزي (راجع db/cron-jobs/inactivity-nudge.sql)
export const INACTIVITY_NUDGE_THRESHOLD_DAYS = 3;

// الحد الأقصى للتقديمات اليومية لكل نوع فٌرصة (راجع lib/rate-limit.ts)
export const MAX_DAILY_APPLICATIONS_PER_TYPE = 2;

// الحد الأقصى لعدد المجالات القابلة للاختيار في الملف الشخصي
export const MAX_APPLICANT_FIELDS = 5;

/**
 * لا يوجد تعديل للفٌرصة بعد نشرها في هذا الإصدار (راجع وثيقة المتطلبات § 5.7:
 * "بعد نشر الفٌرصة، لا تملك الجهة صلاحية تعديل بياناتها"). أي حاجة لتغيير جوهري
 * تُعالَج بإغلاق الفٌرصة الحالية ونشر فٌرصة جديدة، والاحتفاظ بالقديمة كسجل تاريخي.
 * راجع features/opportunities/services/opportunities.service.ts.
 */

// ============ أنواع الدوام ============
export const WORK_MODES = {
  ON_SITE: "on_site",
  REMOTE: "remote",
  HYBRID: "hybrid",
} as const;

export type WorkMode = (typeof WORK_MODES)[keyof typeof WORK_MODES];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  on_site: "حضوري",
  remote: "عن بُعد",
  hybrid: "هجين",
};

// ============ أدوار المستخدمين ============
export const USER_ROLES = {
  APPLICANT: "applicant",
  ORGANIZATION: "organization",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ============ خيارات ترتيب قائمة الفٌرص ============
export const OPPORTUNITY_SORT_OPTIONS = {
  BEST_MATCH: "best_match", // الأكثر مناسبة لي
  DEADLINE_SOON: "deadline_soon", // الأقرب لانتهاء التقديم
  LEAST_APPLIED: "least_applied", // الأقل تقدمًا
  MOST_APPLIED: "most_applied", // الأكثر تقدمًا
  NEWEST: "newest", // الأحدث (الافتراضي)
} as const;

export type OpportunitySortOption =
  (typeof OPPORTUNITY_SORT_OPTIONS)[keyof typeof OPPORTUNITY_SORT_OPTIONS];
