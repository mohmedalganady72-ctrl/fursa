import { auth } from "@/lib/auth/config";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse, type NextRequest } from "next/server";
import { firebaseAdminAuth } from "@/lib/firebase/admin";

/**
 * نقطة النهاية الوحيدة التي تُغذّي كل عمليات Better Auth
 * (تسجيل الدخول، إنشاء الحساب، تسجيل الخروج، التحقق من البريد...).
 * لا حاجة لأي منطق إضافي هنا — كل السلوك مُعرَّف مركزيًا في lib/auth/config.ts.
 */
const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname.endsWith("/firebase-auth/sign-in-with-email")) {
    const body = await request.clone().json().catch(() => null) as { idToken?: string } | null;
    if (body?.idToken) {
      try {
        const token = await firebaseAdminAuth.verifyIdToken(body.idToken);
        if (token.email_verified !== true) {
          return NextResponse.json(
            { message: "يجب التحقق من البريد الإلكتروني قبل تسجيل الدخول." },
            { status: 403 },
          );
        }
      } catch {
        return NextResponse.json({ message: "رمز المصادقة غير صالح." }, { status: 401 });
      }
    }
  }

  return handlers.POST(request);
}
