import { config } from "dotenv";
config({ path: ".env.local" }); // تحميل صريح — تشغيل هذا الملف عبر tsx مباشرة لا يستفيد من تحميل Next.js التلقائي لـ .env.local

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import { reconcileLegacyDatabase } from "./reconcile-legacy";

/**
 * سكربت تشغيل الترحيلات (migrations) على قاعدة البيانات — يُشغَّل عبر `npm run db:migrate`.
 * منفصل عن lib/db/index.ts لأنه يحتاج اتصالًا بـ max: 1 (اتصال واحد فقط) أثناء الترحيل،
 * بخلاف عميل التطبيق العادي الذي يستخدم تجمّع اتصالات (connection pool).
 */
async function main() {
  const migrationClient = postgres(env.DATABASE_URL, { max: 1, prepare: false, ssl: "require" });
  const db = drizzle(migrationClient);

  console.log("جارٍ تشغيل الترحيلات...");
  await reconcileLegacyDatabase(migrationClient);
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  console.log("تم تشغيل الترحيلات بنجاح.");

  await migrationClient.end();
  process.exit(0);
}

main().catch((error) => {
  console.error("فشل تشغيل الترحيلات:", error);
  process.exit(1);
});
