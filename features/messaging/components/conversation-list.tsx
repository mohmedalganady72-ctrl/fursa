import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateArabic } from "@/lib/utils";

export interface ConversationSummary {
  id: string;
  href: string;
  participantName: string;
  participantImage?: string | null;
  opportunityTitle: string;
  lastMessage?: string | null;
  lastActivityAt: Date;
  unreadCount: number;
}

export function ConversationList({ conversations, emptyDescription, embedded = false }: { conversations: ConversationSummary[]; emptyDescription: string; embedded?: boolean }) {
  if (!conversations.length) return <div className={embedded ? "p-4" : "mt-6"}><EmptyState icon={MessageCircle} title="لا توجد محادثات بعد" description={emptyDescription} /></div>;
  return (
    <div className={embedded ? "divide-y divide-neutral-200" : "mt-6 divide-y divide-neutral-200 overflow-hidden rounded-md border border-neutral-200 bg-surface"}>
      {conversations.map((conversation) => (
        <Link key={conversation.id} href={conversation.href} className="flex min-h-20 items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50">
          <Avatar><AvatarImage src={conversation.participantImage ?? undefined} alt={conversation.participantName} /><AvatarFallback>{conversation.participantName.charAt(0) || "؟"}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3"><p className="truncate text-body-sm font-semibold text-neutral-800">{conversation.participantName}</p><time className="shrink-0 text-caption text-neutral-400">{formatDateArabic(conversation.lastActivityAt)}</time></div>
            <p className="truncate text-caption text-secondary">{conversation.opportunityTitle}</p>
            <p className="mt-1 truncate text-body-sm text-neutral-600">{conversation.lastMessage ?? "ابدأ المحادثة الآن"}</p>
          </div>
          {conversation.unreadCount > 0 && <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 px-1.5 text-caption font-semibold !text-white dark:bg-primary-300">{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</span>}
        </Link>
      ))}
    </div>
  );
}
