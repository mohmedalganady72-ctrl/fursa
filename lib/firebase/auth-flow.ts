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

    if (response.error) throw new Error(response.error.message ?? "تعذّر تسجيل الدخول. حاول مرة أخرى.");

    if (role) {
      const roleResponse = await fetch("/api/auth/initialize-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!roleResponse.ok) throw new Error("تعذّر إعداد الحساب. حاول مرة أخرى.");
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
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("/api/auth/destination", { cache: "no-store", credentials: "include" });
    if (response.ok) {
      const result = await response.json();
      return result.data.path as string;
    }
    if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 350 * (attempt + 1)));
  }
  throw new Error("تعذّر تحديد وجهة الحساب بعد تسجيل الدخول. حاول مرة أخرى.");
}

export function firebaseErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "البريد الإلكتروني مستخدم في حساب آخر",
    "auth/invalid-credential": "بيانات الدخول غير صحيحة",
    "auth/invalid-email": "البريد الإلكتروني غير صالح",
    "auth/invalid-phone-number": "رقم الهاتف غير صحيح. تحقق من الرقم وحاول مرة أخرى.",
    "auth/missing-phone-number": "أدخل رقم الهاتف",
    "auth/operation-not-allowed": "تسجيل الدخول بالهاتف غير متاح حاليًا. استخدم البريد الإلكتروني أو Google.",
    "auth/unauthorized-domain": "تسجيل الدخول غير متاح على هذا النطاق. تواصل مع فريق الدعم.",
    "auth/quota-exceeded": "تعذّر إرسال رمز التحقق حاليًا. حاول لاحقًا.",
    "auth/network-request-failed": "تعذّر الاتصال بالخدمة. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.",
    "auth/requires-recent-login": "يلزم تسجيل الدخول مرة أخرى قبل تغيير البريد",
    "auth/user-token-expired": "انتهت جلسة التسجيل. ارجع وسجّل الدخول مرة أخرى.",
    "auth/popup-closed-by-user": "أُغلقت نافذة Google قبل إكمال الدخول",
    "auth/too-many-requests": "محاولات كثيرة، حاول لاحقاً",
    "auth/weak-password": "كلمة المرور ضعيفة؛ استخدم 8 أحرف على الأقل",
    "auth/invalid-verification-code": "رمز التحقق غير صحيح",
    "auth/code-expired": "انتهت صلاحية الرمز. اطلب رمزًا جديدًا.",
  };
  return messages[code] ?? (error instanceof Error ? error.message : "تعذّر تنفيذ العملية. حاول مرة أخرى.");
}
