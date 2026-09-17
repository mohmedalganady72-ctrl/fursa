"use client";

import { authClient } from "@/lib/auth/client";
import { USER_ROLES } from "@/lib/constants";

export type RegistrationRole = typeof USER_ROLES.APPLICANT | typeof USER_ROLES.ORGANIZATION;
export type FirebaseProvider = "email" | "google" | "phone";

let activeSessionRequest: Promise<unknown> | null = null;

export async function createBetterAuthSession(
  provider: FirebaseProvider,
  idToken: string,
  role?: RegistrationRole,
) {
  if (activeSessionRequest) return activeSessionRequest;
  activeSessionRequest = (async () => {
    const response = provider === "google"
      ? await authClient.signInWithGoogle({ idToken })
      : provider === "phone"
        ? await authClient.signInWithPhone({ idToken })
        : await authClient.signInWithEmail({ idToken });

    if (response.error) throw new Error(response.error.message ?? "تعذّر إنشاء جلسة الدخول");

    if (role) {
      const roleResponse = await fetch("/api/auth/initialize-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!roleResponse.ok) throw new Error("تعذّر تهيئة نوع الحساب");
    }

    return response.data;
  })();

  try {
    return await activeSessionRequest;
  } finally {
    activeSessionRequest = null;
  }
}

export function profilePath(role: RegistrationRole) {
  return role === USER_ROLES.ORGANIZATION ? "/organization/profile" : "/applicant/profile";
}

export async function resolvePostAuthPath(requestedPath?: string) {
  if (requestedPath?.startsWith("/") && !requestedPath.startsWith("//") && requestedPath !== "/") return requestedPath;
  const response = await fetch("/api/auth/destination", { cache: "no-store" });
  if (!response.ok) throw new Error("تعذّر تحديد وجهة الحساب بعد تسجيل الدخول");
  const result = await response.json();
  return result.data.path as string;
}

export function firebaseErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "البريد الإلكتروني مستخدم مسبقاً",
    "auth/invalid-credential": "بيانات الدخول غير صحيحة",
    "auth/invalid-email": "البريد الإلكتروني غير صالح",
    "auth/invalid-phone-number": "رقم الهاتف غير صالح، استخدم الصيغة الدولية مثل +9665XXXXXXXX",
    "auth/missing-phone-number": "أدخل رقم الهاتف",
    "auth/operation-not-allowed": "تسجيل الهاتف غير مفعّل. فعّله من Firebase Console ← Authentication ← Sign-in method ← Phone ثم اضغط Enable",
    "auth/unauthorized-domain": "نطاق الموقع غير مضاف إلى Authorized domains في Firebase",
    "auth/quota-exceeded": "تجاوز المشروع حصة الإرسال المسموحة في Firebase",
    "auth/network-request-failed": "تعذّر الاتصال بخدمة Firebase، تحقق من الشبكة وحاول مجدداً",
    "auth/requires-recent-login": "يلزم تسجيل الدخول مرة أخرى قبل تغيير البريد",
    "auth/user-token-expired": "انتهت جلسة التسجيل، ارجع وسجّل الدخول مجدداً",
    "auth/popup-closed-by-user": "أُغلقت نافذة Google قبل إكمال الدخول",
    "auth/too-many-requests": "محاولات كثيرة، حاول لاحقاً",
    "auth/weak-password": "كلمة المرور ضعيفة؛ استخدم 8 أحرف على الأقل",
    "auth/invalid-verification-code": "كود التحقق غير صحيح",
    "auth/code-expired": "انتهت صلاحية الكود، اطلب كوداً جديداً",
  };
  return messages[code] ?? (error instanceof Error ? error.message : "حدث خطأ غير متوقع");
}
