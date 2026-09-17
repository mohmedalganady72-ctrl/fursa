import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function main() {
  await sql.begin(async (tx) => {
    await tx`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
    await tx`CREATE TABLE IF NOT EXISTS "account" (
      "id" text PRIMARY KEY NOT NULL, "account_id" text NOT NULL,
      "provider_id" text NOT NULL, "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "access_token" text, "refresh_token" text, "id_token" text,
      "access_token_expires_at" timestamp, "refresh_token_expires_at" timestamp,
      "scope" text, "password" text, "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`;
    await tx`CREATE TABLE IF NOT EXISTS "session" (
      "id" text PRIMARY KEY NOT NULL, "expires_at" timestamp NOT NULL,
      "token" text NOT NULL UNIQUE, "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL, "ip_address" text,
      "user_agent" text, "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
    )`;
    await tx`CREATE TABLE IF NOT EXISTS "verification" (
      "id" text PRIMARY KEY NOT NULL, "identifier" text NOT NULL, "value" text NOT NULL,
      "expires_at" timestamp NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`;
    await tx`ALTER TABLE "account" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`;
    await tx`ALTER TABLE "session" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`;
    await tx`ALTER TABLE "verification" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`;
    // Keep the existing database compatible with the current profile schema.
    await tx`ALTER TABLE "applicant_profiles" ADD COLUMN IF NOT EXISTS "university" text`;
    await tx`ALTER TABLE "applicant_profiles" ADD COLUMN IF NOT EXISTS "academic_level" text`;
    await tx`ALTER TABLE "applicant_profiles" ADD COLUMN IF NOT EXISTS "skills" jsonb DEFAULT '[]'::jsonb`;
    await tx`ALTER TABLE "applicant_profiles" ADD COLUMN IF NOT EXISTS "experiences" jsonb DEFAULT '[]'::jsonb`;
    await tx`ALTER TABLE "applicant_profiles" ADD COLUMN IF NOT EXISTS "certifications" jsonb DEFAULT '[]'::jsonb`;
    await tx`ALTER TABLE "applicant_profiles" ADD COLUMN IF NOT EXISTS "languages" jsonb DEFAULT '[]'::jsonb`;
    await tx`ALTER TABLE "applicant_profiles" ADD COLUMN IF NOT EXISTS "linkedin_url" text`;
    await tx`ALTER TABLE "applicant_profiles" ADD COLUMN IF NOT EXISTS "github_url" text`;
    await tx`ALTER TABLE "applicant_profiles" ADD COLUMN IF NOT EXISTS "portfolio_url" text`;
  });
  console.log("Better Auth tables verified.");
  await sql.end();
}

main().catch((error) => { console.error(error); process.exit(1); });
