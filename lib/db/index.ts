import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * عميل Drizzle الوحيد للمشروع كامل — يُستورد كـ `db` في كل الـ services.
 * `prepare: false` مطلوب مع Supabase عبر connection pooling (Supavisor/PgBouncer في وضع transaction)
 * لأن الاستعلامات المُجهَّزة مسبقًا (prepared statements) لا تُدعم بشكل موثوق عبر pooler.
 */
type PostgresClient = ReturnType<typeof postgres>;

const globalForPostgres = globalThis as typeof globalThis & {
  __fursaPostgresClient?: PostgresClient;
};

function createPostgresClient() {
  return postgres(env.DATABASE_URL, {
    prepare: false,
    // Vercel ينشئ عدة مثيلات؛ اتصال واحد لكل مثيل يمنع استنزاف Supavisor.
    max: process.env.VERCEL ? 1 : 5,
    connect_timeout: 5,
    idle_timeout: 60,
    max_lifetime: 60 * 5,
  });
}

// يحافظ على pool واحد أثناء إعادة التجميع السريع في next dev بدل فتح pool جديد مع كل HMR.
const client = globalForPostgres.__fursaPostgresClient ?? createPostgresClient();
globalForPostgres.__fursaPostgresClient = client;

export const db = drizzle(client, { schema });

export type DbClient = typeof db;
