"use client";

import { authClient } from "@/lib/auth/client";
import { normalizeRedirectPath } from "@/lib/auth/redirects";
import { USER_ROLES } from "@/lib/constants";

export type RegistrationRole = typeof USER_ROLES.APPLICANT | typeof USER_ROLES.ORGANIZATION;
export type FirebaseProvider = "email" | "google" | "phone";

const VERIFICATION_CONTEXT_COOKIE = "fursa.verification_context";
const POST_PROFILE_REDIRECT_COOKIE = "fursa.post_profile_redirect";
const VERIFICATION_CONTEXT_MAX_AGE = 60 * 60 * 24 * 2;
const POST_PROFILE_REDIRECT_MAX_AGE = 60 * 60 * 24 * 7;

export type VerificationContext = {
  mode: "login" | "register";
  role?: RegistrationRole;
  redirectTo?: string;
};

let activeSessionRequest: Promise<unknown> | null = null;
const AUTH_REQUEST_TIMEOUT_MS = 20_000;

async function withAuthTimeout<T>(operation: Promise<T>, message: string): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), AUTH_REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
}

function isTransientAuthError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: number; statusCode?: number; code?: string };
  return [500, 502, 503, 504].includes(candidate.status ?? candidate.statusCode ?? 0)
    || candidate.code === "INTERNAL_SERVER_ERROR";
}

async function waitForRetry(attempt: number) {
  await new Promise((resolve) => window.setTimeout(resolve, 400 * (attempt + 1)));
}

export async function signInWithPassword(email: string, password: string) {
  let lastResponse: Awaited<ReturnType<typeof authClient.signIn.email>> | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      lastResponse = await withAuthTimeout(
        authClient.signIn.email({ email: email.trim().toLowerCase(), password, rememberMe: true }),
        "استغرق تسجيل الدخول وقتًا أطول من المتوقع. حاول مرة أخرى.",
      );
      if (!lastResponse.error || !isTransientAuthError(lastResponse.error)) return lastResponse;
      if (attempt === 2) throw new Error("تعذّر الاتصال بخدمة تسجيل الدخول. حاول مرة أخرى بعد قليل.");
    } catch (error) {
      if (attempt === 2) throw error;
    }
    await waitForRetry(attempt);
  }
  return lastResponse!;
}

function setClientCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function getClientCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  const value = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix))?.slice(prefix.length);
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function deleteClientCookie(name: string) {
  if (typeof window === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function rememberLoginVerification(redirectTo?: string) {
  const context: VerificationContext = { mode: "login", redirectTo: normalizeRedirectPath(redirectTo) };
  setClientCookie(VERIFICATION_CONTEXT_COOKIE, JSON.stringify(context), VERIFICATION_CONTEXT_MAX_AGE);
}

export function rememberRegistrationVerification(role: RegistrationRole, redirectTo?: string) {
  const context: VerificationContext = { mode: "register", role, redirectTo: normalizeRedirectPath(redirectTo) };
  setClientCookie(VERIFICATION_CONTEXT_COOKIE, JSON.stringify(context), VERIFICATION_CONTEXT_MAX_AGE);
  rememberPostProfileRedirect(redirectTo);
}

export function getVerificationContext(): VerificationContext | null {
  const value = getClientCookie(VERIFICATION_CONTEXT_COOKIE);
  if (!value) return null;

  try {
    const context = JSON.parse(value) as Partial<VerificationContext>;
    if (context.mode !== "login" && context.mode !== "register") return null;
    const role = context.role === USER_ROLES.APPLICANT || context.role === USER_ROLES.ORGANIZATION
      ? context.role
      : undefined;
    return { mode: context.mode, role, redirectTo: normalizeRedirectPath(context.redirectTo) };
  } catch {
    return null;
  }
}

export function clearVerificationContext() {
  deleteClientCookie(VERIFICATION_CONTEXT_COOKIE);
}

export function rememberPostProfileRedirect(redirectTo?: string) {
  const path = normalizeRedirectPath(redirectTo);
  if (path) setClientCookie(POST_PROFILE_REDIRECT_COOKIE, path, POST_PROFILE_REDIRECT_MAX_AGE);
  else clearPostProfileRedirect();
}

export function consumePostProfileRedirect() {
  const path = normalizeRedirectPath(getClientCookie(POST_PROFILE_REDIRECT_COOKIE));
  clearPostProfileRedirect();
  return path;
}

export function clearPostProfileRedirect() {
  deleteClientCookie(POST_PROFILE_REDIRECT_COOKIE);
}

export async function createBetterAuthSession(
  provider: FirebaseProvider,
  idToken: string,
  role?: RegistrationRole,
) {
  if (activeSessionRequest) return activeSessionRequest;
  activeSessionRequest = (async () => {
    let response: Awaited<ReturnType<typeof authClient.signInWithEmail>> | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      response = await withAuthTimeout(
        provider === "google"
          ? authClient.signInWithGoogle({ idToken })
          : provider === "phone"
            ? authClient.signInWithPhone({ idToken })
            : authClient.signInWithEmail({ idToken }),
        "استغرق إنشاء الجلسة وقتًا أطول من المتوقع. حاول مرة أخرى.",
      );
      if (!response.error || !isTransientAuthError(response.error) || attempt === 2) break;
      await waitForRetry(attempt);
    }

    if (!response || response.error) throw new Error(response?.error?.message ?? "تعذّر تسجيل الدخول. حاول مرة أخرى.");

    if (role) {
      let roleResponse: Response | undefined;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        roleResponse = await fetch("/api/auth/initialize-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
          body: JSON.stringify({ role }),
        });
        if (roleResponse.status < 500 || attempt === 2) break;
        await waitForRetry(attempt);
      }
      if (!roleResponse) throw new Error("تعذّر إعداد الحساب. حاول مرة أخرى.");
      if (!roleResponse.ok) {
        const result = await roleResponse.json().catch(() => null);
        throw new Error(result?.message ?? "تعذّر إعداد الحساب. حاول مرة أخرى.");
      }
    }

    return response.data;
  })();

  try {
    return await activeSessionRequest;
  } finally {
    activeSessionRequest = null;
  }
}

export async function resolvePostAuthPath(requestedPath?: string) {
  const query = requestedPath ? `?redirectTo=${encodeURIComponent(requestedPath)}` : "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`/api/auth/destination${query}`, {
        cache: "no-store",
        credentials: "include",
        signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
      });
      if (response.ok) {
        const result = await response.json();
        return result.data.path as string;
      }
    } catch (error) {
      if (attempt === 2) throw error;
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
