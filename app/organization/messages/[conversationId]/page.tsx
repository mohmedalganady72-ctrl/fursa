import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requirePageSession } from "@/lib/auth/session";
import { ChatWindow } from "@/features/messaging/components/chat-window";
import { listConversationMessages, markConversationMessagesAsRead } from "@/features/messaging/services/messages.service";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";

/** مطابقة تمامًا لـ app/(applicant)/messages/[conversationId]/page.tsx — راجع تعليقات ذلك الملف */
export default async function OrganizationConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const session = await requirePageSession();

  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
    with: { application: { with: { applicantProfile: true, opportunity: true } } },
  });
  if (!conversation) notFound();

  const messages = await listConversationMessages(conversationId, session.user.id).catch(() => null);
  if (!messages) notFound();
  await markConversationMessagesAsRead(conversationId, session.user.id);

  return <ChatWindow
        conversationId={conversationId}
        currentUserId={session.user.id}
        initialMessages={messages}
        participantName={conversation.application.applicantProfile.fullName}
        opportunityTitle={conversation.application.opportunity.title}
      />;
}
