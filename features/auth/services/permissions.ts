import type { Session } from "@/lib/auth/config";
import { USER_ROLES, type UserRole } from "@/lib/constants";

/**
 * منطق الصلاحيات المركزي (RBAC) — يُستدعى من middleware.ts ومن أي Route Handler
 * يحتاج تحققًا إضافيًا دقيقًا لا يكفيه فحص الدور وحده (مثل: هل هذه الجهة معتمدة فعليًا؟).
 * تجميع كل قواعد الصلاحية هنا بدل تكرارها بشكل متفرق يضمن مصدرًا واحدًا للحقيقة
 * عند تدقيق الأمان لاحقًا.
 */

export function hasRole(session: Session | null, role: UserRole): boolean {
  return session?.user?.role === role;
}

export function isApplicant(session: Session | null): boolean {
  return hasRole(session, USER_ROLES.APPLICANT);
}

export function isOrganization(session: Session | null): boolean {
  return hasRole(session, USER_ROLES.ORGANIZATION);
}

export function isAdmin(session: Session | null): boolean {
  return hasRole(session, USER_ROLES.ADMIN);
}

/**
 * تتحقق من أن المستخدم ليس فقط بدور "جهة"، بل أن حسابه مفعَّل فعليًا
 * (بعد اعتماد المدير — راجع حالات الاستخدام § 2 و§10).
 * تُستخدم في app/(organization)/layout.tsx قبل عرض أي صفحة من لوحة الجهة.
 */
export function isActiveOrganization(session: Session | null): boolean {
  return isOrganization(session) && session?.user?.isActive === true;
}

/**
 * يتحقق من ملكية مورد معيّن (مثال: هل هذا التقديم يخص الباحث الحالي؟).
 * يُستخدم في services الميزات المختلفة قبل تنفيذ أي عملية تعديل/حذف حساسة،
 * كطبقة دفاع إضافية فوق سياسات RLS في قاعدة البيانات (Defense in Depth).
 */
export function assertOwnership(resourceOwnerId: string, currentUserId: string): void {
  if (resourceOwnerId !== currentUserId) {
    throw new Error("FORBIDDEN");
  }
}
