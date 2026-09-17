import { USER_ROLES, type UserRole } from "@/lib/constants";

const AUTH_PATHS = new Set([
  "/login",
  "/register",
  "/admin-login",
  "/verify-email",
  "/verify-phone",
  "/forgot-password",
  "/reset-password",
]);

/** Returns a same-origin path or undefined when the value could escape the app. */
export function normalizeRedirectPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return undefined;

  try {
    const url = new URL(value, "https://fursa.local");
    if (url.origin !== "https://fursa.local" || AUTH_PATHS.has(url.pathname)) return undefined;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}

export function isRedirectAllowedForRole(path: string, role: UserRole) {
  const pathname = new URL(path, "https://fursa.local").pathname;
  if (role === USER_ROLES.ADMIN) return pathname === "/admin" || pathname.startsWith("/admin/");
  if (role === USER_ROLES.ORGANIZATION) return pathname === "/organization" || pathname.startsWith("/organization/");
  return pathname === "/applicant" || pathname.startsWith("/applicant/");
}

export function safeRedirectForRole(value: string | null | undefined, role: UserRole) {
  const path = normalizeRedirectPath(value);
  return path && isRedirectAllowedForRole(path, role) ? path : undefined;
}
