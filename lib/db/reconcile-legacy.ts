import { readFile } from "node:fs/promises";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import type postgres from "postgres";
import * as schema from "./schema";

export async function reconcileLegacyDatabase(client: postgres.Sql) {
  const [legacy] = await client`select exists(select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
    where t.typname='opportunity_status' and e.enumlabel='open') as detected`;
  if (!legacy?.detected) return;
  // PostgreSQL requires newly added enum values to commit before any data uses them.
  for (const value of ["draft", "published", "expired"]) {
    await client.unsafe(`ALTER TYPE public.opportunity_status ADD VALUE IF NOT EXISTS '${value}'`);
  }
  for (const value of ["applied", "under_review", "shortlisted", "withdrawn", "closed"]) {
    await client.unsafe(`ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS '${value}'`);
  }
  const journal = JSON.parse(await readFile("lib/db/migrations/meta/_journal.json", "utf8")) as {
    entries: { tag: string; when: number }[];
  };
  const baseline = journal.entries.find((entry) => entry.tag === "0001_fuzzy_colossus")!;
  const [alreadyBaselined] = await client`select 1 from drizzle.__drizzle_migrations where created_at >= ${baseline.when} limit 1`;
  if (alreadyBaselined) return;
  const migration = await readFile("lib/db/migrations/0002_reconcile-production-schema.sql", "utf8");
  await client.begin(async (tx) => {
    await tx.unsafe(migration);
    const columns = await tx`select table_name,column_name from information_schema.columns where table_schema='public'`;
    const actual = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
    const missing = new Set<string>();
    for (const table of Object.values(schema)) {
      if (!(table instanceof PgTable)) continue;
      const definition = getTableConfig(table);
      for (const column of definition.columns) {
        if (!actual.has(`${definition.name}.${column.name}`)) missing.add(`${definition.name}.${column.name}`);
      }
    }
    if (missing.size) throw new Error(`LEGACY_SCHEMA_INCOMPLETE: ${[...missing].join(", ")}`);
    // Record a verified baseline, preserving every original migration record and all user data.
    await tx`insert into drizzle.__drizzle_migrations(hash,created_at)
      values ('verified-legacy-schema-baseline',${baseline.when})`;
  });
  console.log("Legacy schema reconciled and baseline verified without deleting records.");
}
