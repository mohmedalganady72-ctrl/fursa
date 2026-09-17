import { auth } from "@/lib/auth/config";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * نقطة النهاية الوحيدة التي تُغذّي كل عمليات Better Auth
 * (تسجيل الدخول، إنشاء الحساب، تسجيل الخروج، التحقق من البريد...).
 * لا حاجة لأي منطق إضافي هنا — كل السلوك مُعرَّف مركزيًا في lib/auth/config.ts.
 */
export const { GET, POST } = toNextJsHandler(auth);
