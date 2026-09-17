import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * عميل Drizzle الوحيد للمشروع كامل — يُستورد كـ `db` في كل الـ services.
 * `prepare: false` مطلوب مع Supabase عبر connection pooling (Supavisor/PgBouncer في وضع transaction)
 * لأن الاستعلامات المُجهَّزة مسبقًا (prepared statements) لا تُدعم بشكل موثوق عبر pooler.
 */
const client = postgres(env.DATABASE_URL, {
  prepare: false,
  // حد محافظ يناسب Supavisor؛ استعلامات الإحصاءات مجمّعة لتفادي طابور طويل.
  max: 5,
  connect_timeout: 15,
  idle_timeout: 20,
  max_lifetime: 60 * 10,
});

export const db = drizzle(client, { schema });

export type DbClient = typeof db;
