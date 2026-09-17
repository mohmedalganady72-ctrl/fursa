import { pgTable, uuid, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { conversations } from "./conversations";
import { users } from "./users";

/**
 * رسائل الدردشة. تُبَث فوريًا عبر Supabase Realtime (channel مبني على conversationId)
 * — راجع features/messaging/hooks/use-realtime-chat.ts.
 * senderId عام (users.id) بدل applicant/organization منفصلين لأن أي طرف من الاثنين
 * قد يرسل، والتمييز بينهما يُستنتج من دوره وقت العرض فقط.
 */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    content: text("content").notNull(),
    isRead: boolean("is_read").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    conversationIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
