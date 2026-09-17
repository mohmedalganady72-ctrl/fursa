import { eq, asc, and, ne, or, count, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { messages, conversations, applications, applicantProfiles, opportunities, organizationProfiles, notifications } from "@/lib/db/schema";
import { createNotification } from "@/features/notifications/services/notifications.service";

async function getAuthorizedConversation(conversationId: string, userId: string) {
  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
    with: {
      application: {
        with: {
          applicantProfile: true,
          opportunity: { with: { organizationProfile: true } },
        },
      },
    },
  });
  if (!conversation) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }
  const applicantUserId = conversation.application.applicantProfile.userId;
  const organizationUserId = conversation.application.opportunity.organizationProfile.userId;
  if (userId !== applicantUserId && userId !== organizationUserId) throw new Error("FORBIDDEN");
  return conversation;
}

export async function sendMessage(params: { conversationId: string; senderId: string; content: string }) {
  const content = params.content.trim();
  if (!content) throw new Error("EMPTY_MESSAGE");
  if (content.length > 2000) throw new Error("MESSAGE_TOO_LONG");
  const conversation = await getAuthorizedConversation(params.conversationId, params.senderId);
  const [created] = await db.insert(messages).values({
    conversationId: params.conversationId,
    senderId: params.senderId,
    content,
  }).returning();
  if (!created) throw new Error("MESSAGE_CREATE_FAILED");

  const applicantUserId = conversation.application.applicantProfile.userId;
  const organizationUserId = conversation.application.opportunity.organizationProfile.userId;
  const sentByApplicant = params.senderId === applicantUserId;
  await createNotification({
    userId: sentByApplicant ? organizationUserId : applicantUserId,
    type: "new_message",
    title: "رسالة جديدة",
    body: content.slice(0, 100),
    linkUrl: `/${sentByApplicant ? "organization" : "applicant"}/messages/${params.conversationId}`,
  });
  return created;
}

export async function listConversationMessages(conversationId: string, currentUserId: string) {
  await getAuthorizedConversation(conversationId, currentUserId);
  return db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: asc(messages.createdAt),
  });
}

export async function markConversationMessagesAsRead(conversationId: string, currentUserId: string) {
  await getAuthorizedConversation(conversationId, currentUserId);
  await db.update(messages).set({ isRead: true }).where(and(
    eq(messages.conversationId, conversationId),
    eq(messages.isRead, false),
    ne(messages.senderId, currentUserId)
  ));
  await db.update(notifications).set({ isRead: true }).where(and(
    eq(notifications.userId, currentUserId),
    eq(notifications.type, "new_message"),
    like(notifications.linkUrl, `%/messages/${conversationId}`),
  ));
}

export async function getUnreadMessageCount(userId: string) {
  const [result] = await db
    .select({ value: count() })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .innerJoin(applications, eq(conversations.applicationId, applications.id))
    .innerJoin(applicantProfiles, eq(applications.applicantProfileId, applicantProfiles.id))
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .innerJoin(organizationProfiles, eq(opportunities.organizationProfileId, organizationProfiles.id))
    .where(and(
      eq(messages.isRead, false),
      ne(messages.senderId, userId),
      or(eq(applicantProfiles.userId, userId), eq(organizationProfiles.userId, userId)),
    ));
  return result?.value ?? 0;
}
