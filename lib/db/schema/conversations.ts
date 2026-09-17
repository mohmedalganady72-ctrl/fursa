import { pgTable, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { applications } from "./applications";

/**
 * محادثة واحدة لكل تقديم مقبول — تُنشأ تلقائيًا لحظة قبول الجهة للمتقدم
 * (راجع features/applications/services/acceptance-lifecycle.ts).
 * الربط بـ applicationId بدل ربط مباشر (organization ↔ applicant) يضمن أن كل محادثة
 * مؤطَّرة بسياق فرصة محددة، ويمنع بقاء المحادثة مفتوحة بعد رفض/سقوط التقديم دون سياق واضح.
 */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    applicationIdUnique: uniqueIndex("conversations_application_id_idx").on(table.applicationId),
  })
);

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  application: one(applications, {
    fields: [conversations.applicationId],
    references: [applications.id],
  }),
}));

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
