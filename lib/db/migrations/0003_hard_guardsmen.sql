ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_restricted" boolean DEFAULT false NOT NULL;
