import { requireSession } from "@/lib/auth/session";
import { MessagingShell } from "@/features/messaging/components/messaging-shell";
import { listApplicantConversations } from "@/features/messaging/services/conversation-lists.service";

export default async function ApplicantMessagesLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const conversations = await listApplicantConversations(session.user.id);
  return <MessagingShell conversations={conversations} basePath="/applicant/messages">{children}</MessagingShell>;
}
