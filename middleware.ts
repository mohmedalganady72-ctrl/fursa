import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { USER_ROLES } from "@/lib/constants";

/**
 * Middleware مركزي يعمل قبل الوصول لأي مسار محمي — يمنع حتى وميض عرض صفحة
 * محمية للحظة قبل إعادة التوجيه (مشكلة شائعة عند فحص الصلاحية داخل الصفحة نفسها فقط).
 *
 * ملاحظة تصميمية: يقرأ الـ middleware فقط كوكي الجلسة (توقيع سريع، بلا استعلام قاعدة بيانات)
 * للتحقق من "هل يوجد تسجيل دخول أصلًا ومن أي دور" — الفحص الدقيق (هل الحساب نشط ومعتمد)
 * يحدث داخل layout.tsx الخاص بكل مجموعة مسارات عبر lib/auth/session.ts،
 * لأن ذلك يحتاج استعلام قاعدة بيانات لا يجب تكراره في كل طلب على مستوى edge.
 */

const ROUTE_ROLE_MAP: Array<{ prefix: string; role: string }> = [
  { prefix: "/organizations", role: USER_ROLES.APPLICANT },
  { prefix: "/opportunities", role: USER_ROLES.APPLICANT },
  { prefix: "/applicant", role: USER_ROLES.APPLICANT },
  { prefix: "/organization", role: USER_ROLES.ORGANIZATION },
  { prefix: "/admin", role: USER_ROLES.ADMIN },
];

const SESSION_COOKIE_NAME = "better-auth.session_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/organizations/")) {
    return NextResponse.redirect(new URL(`/applicant${pathname}`, request.url));
  }

  const matchedRoute = ROUTE_ROLE_MAP.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (!matchedRoute) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    const loginPath = matchedRoute.role === USER_ROLES.ADMIN ? "/admin-login" : "/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // وجود الكوكي يعني جلسة محتملة صالحة؛ التحقق من الدور الفعلي والحالة (نشط/معتمد)
  // يحدث في layout.tsx كما هو موضّح أعلاه.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/opportunities/:path*",
    "/applicant/:path*",
    "/organization/:path*",
    "/organizations/:path*",
    "/admin/:path*",
  ],
};
