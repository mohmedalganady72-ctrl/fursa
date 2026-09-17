import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/session";
import { ChatWindow } from "@/features/messaging/components/chat-window";
import { listConversationMessages, markConversationMessagesAsRead } from "@/features/messaging/services/messages.service";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";

/**
 * صفحة محادثة محددة — نفس ChatWindow المستخدَم في app/(organization)/messages/[id]
 * بالضبط، لأن مكوّن الدردشة محايد تمامًا تجاه دور المستخدم (راجع chat-window.tsx).
 */
export default async function ApplicantConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const session = await getServerSession();

  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
    with: { application: { with: { opportunity: { with: { organizationProfile: true } } } } },
  });
  if (!conversation) notFound();

  const messages = await listConversationMessages(conversationId, session!.user.id).catch(() => null);
  if (!messages) notFound();
  await markConversationMessagesAsRead(conversationId, session!.user.id);

  return <ChatWindow
        conversationId={conversationId}
        currentUserId={session!.user.id}
        initialMessages={messages}
        participantName={conversation.application.opportunity.organizationProfile?.name ?? "الجهة"}
        opportunityTitle={conversation.application.opportunity.title}
      />;
}
