import {
  pgTable,
  text,
  timestamp,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const sessions = pgTable(
  "session",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),

    expiresAt: timestamp("expires_at").notNull(),

    token: text("token").notNull().unique(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),

    ipAddress: text("ip_address"),

    userAgent: text("user_agent"),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),

    accountId: text("account_id").notNull(),

    providerId: text("provider_id").notNull(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    accessToken: text("access_token"),

    refreshToken: text("refresh_token"),

    idToken: text("id_token"),

    accessTokenExpiresAt: timestamp("access_token_expires_at"),

    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),

    scope: text("scope"),

    password: text("password"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verifications = pgTable(
  "verification",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),

    identifier: text("identifier").notNull(),

    value: text("value").notNull(),

    expiresAt: timestamp("expires_at").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("verification_identifier_idx").on(table.identifier),
  ]
);

// Canonical singular model keys expected by Better Auth.
export const session = sessions;
export const account = accounts;
export const verification = verifications;
