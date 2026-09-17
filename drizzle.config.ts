import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
// استيراد مباشر بدل alias @/ — drizzle-kit لا يحترم مسارات tsconfig.json
// عند تحميل ملف الإعداد نفسه (قيد موثَّق في أداة drizzle-kit)، فنستخدم هنا
// استيرادًا نسبيًا صريحًا تفاديًا لهذا القيد، رغم أن بقية المشروع يستخدم @/ بلا مشاكل.
import { z } from "zod";

config({ path: ".env.local" }); // drizzle-kit لا يحمّل .env.local تلقائيًا كما يفعل Next.js

const envSchema = z.object({ DATABASE_URL: z.string().url() });
const env = envSchema.parse(process.env);

// يُستخدم عبر أوامر `npm run db:generate` و`npm run db:studio`
export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
