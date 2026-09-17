// import { z } from "zod";

// /**
//  * التحقق من متغيرات البيئة عند بدء تشغيل التطبيق بدل اكتشاف غيابها لاحقًا
//  * في منتصف طلب مستخدم حقيقي. أي متغير ناقص يوقف البناء فورًا برسالة واضحة.
//  */
// const envSchema = z.object({
//   // قاعدة البيانات
//   DATABASE_URL: z.string().url(),

//   // Supabase
//   NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
//   NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
//   SUPABASE_SERVICE_ROLE_KEY: z.string().min(1), // سرّي — للخادم فقط، لا يُكشف أبدًا للمتصفح

//   // المصادقة
//   BETTER_AUTH_SECRET: z.string().min(32),
//   BETTER_AUTH_URL: z.string().url(),

//   // البريد الإلكتروني (Nylas Transactional Send — إرسال من دومين مُتحقَّق منه، بلا grant)
//   NYLAS_API_KEY: z.string().min(1),
//   NYLAS_API_URI: z.string().url().default("https://api.us.nylas.com"),
//   NYLAS_SENDER_DOMAIN: z.string().min(1), // الدومين المُتحقَّق منه في لوحة Nylas

//   // تحليل السيرة الذاتية عبر LLM
//   LLM_API_KEY: z.string().min(1),

//   // حماية مسارات cron من الاستدعاء العشوائي من خارج Vercel/Supabase
//   CRON_SECRET: z.string().min(16),
// });

// // Type-safe env — يُستورد كـ `env` بدل `process.env` مباشرة في كل الكود
// export const env = envSchema.parse(process.env);

// export type Env = z.infer<typeof envSchema>;

import { config } from "dotenv";
import { z } from "zod";

// تحميل متغيرات البيئة قبل التحقق منها
config({ path: ".env.local", quiet: true });

/**
 * التحقق من متغيرات البيئة عند بدء تشغيل التطبيق بدل اكتشاف غيابها لاحقًا
 * في منتصف طلب مستخدم حقيقي. أي متغير ناقص يوقف البناء فورًا برسالة واضحة.
 */
const envSchema = z.object({
  // قاعدة البيانات
  DATABASE_URL: z.string().url(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Firebase Authentication
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_CONTACT_EMAIL: z.string().email().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // المصادقة
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // البريد الإلكتروني
  NYLAS_API_KEY: z.string().min(1),
  NYLAS_API_URI: z.string().url().default("https://api.us.nylas.com"),
  NYLAS_SENDER_DOMAIN: z.string().min(1),
  NYLAS_FROM_EMAIL: z.string().email().optional(),

  // تحليل السيرة الذاتية عبر LLM
  LLM_API_KEY: z.string().min(1),

  // حماية مسارات cron
  CRON_SECRET: z.string().min(16),
});

// Type-safe env
export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
