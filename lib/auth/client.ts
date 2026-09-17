"use client";

import { createAuthClient } from "better-auth/react";
import { firebaseAuthClientPlugin } from "better-auth-firebase-auth/client";

/**
 * عميل Better Auth الجانب-متصفح — يُستخدم في كل صفحات (auth)/* لاستدعاء
 * تسجيل الدخول/إنشاء الحساب/تسجيل الخروج مباشرة من مكوّنات العميل،
 * دون الحاجة لكتابة fetch يدوي لكل عملية (Better Auth يغلّف ذلك تلقائيًا).
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [firebaseAuthClientPlugin()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
