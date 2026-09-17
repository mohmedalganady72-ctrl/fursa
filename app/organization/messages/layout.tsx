import { requireSession } from "@/lib/auth/session";
import { MessagingShell } from "@/features/messaging/components/messaging-shell";
import { listOrganizationConversations } from "@/features/messaging/services/conversation-lists.service";

export default async function OrganizationMessagesLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const conversations = await listOrganizationConversations(session.user.id);
  return <MessagingShell conversations={conversations} basePath="/organization/messages">{children}</MessagingShell>;
}
