import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { firebaseAuthPlugin } from "better-auth-firebase-auth/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { firebaseAdminAuth } from "@/lib/firebase/admin";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { withDatabaseRetry } from "@/lib/db/retry";

function getAuthBaseUrl() {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (!vercelHost) return env.BETTER_AUTH_URL;
  return vercelHost.startsWith("http") ? vercelHost : `https://${vercelHost}`;
}

const authBaseUrl = getAuthBaseUrl();
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const previewHostPattern = productionHost?.endsWith(".vercel.app")
  ? `${productionHost.slice(0, -".vercel.app".length)}-*.vercel.app`
  : undefined;
const authBaseUrlConfig = process.env.VERCEL
  ? {
      allowedHosts: [productionHost, process.env.VERCEL_URL, previewHostPattern].filter(
        (host): host is string => Boolean(host),
      ),
      fallback: authBaseUrl,
      protocol: "https" as const,
    }
  : env.BETTER_AUTH_URL;

/**
 * إعداد Better Auth المركزي — نقطة التعريف الوحيدة لسلوك المصادقة في المشروع.
 * يُستورد هذا الملف في:
 *  - app/api/auth/[...all]/route.ts (نقطة النهاية الفعلية)
 *  - lib/auth/session.ts (قراءة الجلسة من أي Server Component/Route Handler)
 *  - middleware.ts (التحقق السريع من وجود جلسة قبل الدخول للمسارات المحمية)
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", usePlural: false }),

  // The users table uses UUID primary/foreign keys throughout the platform.
  // Better Auth must therefore generate UUIDs instead of its default IDs.
  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  // البريد وكلمة المرور فقط في الإصدار الأول — لا مصادقة اجتماعية (Google/Facebook) حاليًا
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: false,
  },

  // حقل "role" مخصص إضافي على المستخدم — يُقرأ لاحقًا في middleware.ts وlib/auth/session.ts
  // لتوجيه كل مستخدم للوحته الصحيحة (باحث/جهة/مدير)
  // user: {
  //   additionalFields: {
  //     role: {
  //       type: "string",
  //       required: true,
  //       input: true, // يُحدَّد وقت التسجيل (راجع صفحة app/(auth)/register)
  //     },
  //     isActive: {
  //       type: "boolean",
  //       required: false,
  //       defaultValue: false,
  //       input: false, // لا يُحدَّد من المستخدم — فقط عبر منطق التفعيل/الاعتماد
  //     },
  //   },
  // },
  user: {
  modelName: "users",

  additionalFields: {
    role: {
      type: "string",
      required: false,
      defaultValue: "applicant",
      input: false,
    },

    isActive: {
      type: "boolean",
      required: false,
      defaultValue: false,
      input: false,
    },
    isRestricted: {
      type: "boolean",
      required: false,
      defaultValue: false,
      input: false,
    },
  },
},

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 يومًا
    updateAge: 60 * 60 * 24, // تحديث الجلسة كل يوم عند النشاط
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
      strategy: "jwe",
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          await withDatabaseRetry(() => db.update(users)
            .set({ lastLoginAt: new Date(), updatedAt: new Date() })
            .where(eq(users.id, session.userId)));
        },
      },
    },
  },

  plugins: [
    firebaseAuthPlugin({
      useClientSideTokens: true,
      sessionExpiresInDays: 30,
      firebaseAdminAuth,
      firebaseConfig: {
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      },
      passwordResetUrl: `${authBaseUrl}/reset-password`,
      getPhoneUserFallbackEmail: ({ uid }) => `${uid}@phone.fursa.local`,
    }),
  ],

  baseURL: authBaseUrlConfig,
  secret: env.BETTER_AUTH_SECRET,
});

export type Session = typeof auth.$Infer.Session;
