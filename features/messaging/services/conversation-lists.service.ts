import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { applicantProfiles, applications, conversations, messages, opportunities, organizationProfiles } from "@/lib/db/schema";
import type { ConversationSummary } from "@/features/messaging/components/conversation-list";

export async function listOrganizationConversations(userId: string): Promise<ConversationSummary[]> {
  const profile = await db.query.organizationProfiles.findFirst({ where: eq(organizationProfiles.userId, userId) });
  const opportunityRows = profile ? await db.query.opportunities.findMany({ where: eq(opportunities.organizationProfileId, profile.id) }) : [];
  const applicationRows = opportunityRows.length ? await db.query.applications.findMany({ where: inArray(applications.opportunityId, opportunityRows.map((item) => item.id)), with: { applicantProfile: true, opportunity: true } }) : [];
  const conversationRows = applicationRows.length ? await db.query.conversations.findMany({ where: inArray(conversations.applicationId, applicationRows.map((item) => item.id)) }) : [];
  const messageRows = conversationRows.length ? await db.query.messages.findMany({ where: inArray(messages.conversationId, conversationRows.map((item) => item.id)), orderBy: desc(messages.createdAt) }) : [];
  return conversationRows.map((conversation) => {
    const application = applicationRows.find((item) => item.id === conversation.applicationId)!;
    const relevant = messageRows.filter((message) => message.conversationId === conversation.id);
    const latest = relevant[0];
    return { id: conversation.id, href: `/organization/messages/${conversation.id}`, participantName: application.applicantProfile.fullName, participantImage: application.applicantProfile.avatarUrl, opportunityTitle: application.opportunity.title, lastMessage: latest?.content, lastActivityAt: latest?.createdAt ?? conversation.createdAt, unreadCount: relevant.filter((message) => !message.isRead && message.senderId !== userId).length };
  }).sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
}

export async function listApplicantConversations(userId: string): Promise<ConversationSummary[]> {
  const profile = await db.query.applicantProfiles.findFirst({ where: eq(applicantProfiles.userId, userId) });
  const applicationRows = profile ? await db.query.applications.findMany({ where: eq(applications.applicantProfileId, profile.id), with: { applicantProfile: true, opportunity: { with: { organizationProfile: true } } } }) : [];
  const conversationRows = applicationRows.length ? await db.query.conversations.findMany({ where: inArray(conversations.applicationId, applicationRows.map((item) => item.id)) }) : [];
  const messageRows = conversationRows.length ? await db.query.messages.findMany({ where: inArray(messages.conversationId, conversationRows.map((item) => item.id)), orderBy: desc(messages.createdAt) }) : [];
  return conversationRows.map((conversation) => {
    const application = applicationRows.find((item) => item.id === conversation.applicationId)!;
    const relevant = messageRows.filter((message) => message.conversationId === conversation.id);
    const latest = relevant[0];
    const organization = application.opportunity.organizationProfile;
    return { id: conversation.id, href: `/applicant/messages/${conversation.id}`, participantName: organization?.name ?? "الجهة", participantImage: organization?.logoUrl, opportunityTitle: application.opportunity.title, lastMessage: latest?.content, lastActivityAt: latest?.createdAt ?? conversation.createdAt, unreadCount: relevant.filter((message) => !message.isRead && message.senderId !== userId).length };
  }).sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
}
