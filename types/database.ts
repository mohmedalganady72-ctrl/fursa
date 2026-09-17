/**
 * إعادة تصدير مركزية لكل أنواع Drizzle المُستنتَجة (Select/Insert) —
 * يسمح للمكوّنات والصفحات باستيراد "User", "Opportunity", إلخ من مسار واحد ثابت
 * (@/types/database) بدل تتبّع أي ملف schema فرعي يُعرِّف كل نوع.
 */
export type {
  User,
  NewUser,
  ApplicantProfile,
  NewApplicantProfile,
  OrganizationProfile,
  NewOrganizationProfile,
  OrganizationJoinRequest,
  NewOrganizationJoinRequest,
  Admin,
  NewAdmin,
  Opportunity,
  NewOpportunity,
  Application,
  NewApplication,
  Notification,
  NewNotification,
  Conversation,
  NewConversation,
  Message,
  NewMessage,
  Field,
  NewField,
} from "@/lib/db/schema";
