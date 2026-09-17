"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, CheckCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeChat } from "../hooks/use-realtime-chat";
import type { Message } from "@/lib/db/schema";

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  participantName?: string;
  opportunityTitle?: string;
}

/**
 * نافذة الدردشة الكاملة — تُستخدم في لوحتي الباحث والجهة بنفس الشكل تمامًا
 * (لا فرق بصري بين الطرفين سوى محاذاة الفقاعة حسب senderId).
 */
export function ChatWindow({
  conversationId,
  currentUserId,
  initialMessages,
  participantName,
  opportunityTitle,
}: ChatWindowProps) {
  const { toast } = useToast();
  const pathname = usePathname();
  const messagesPath = pathname.startsWith("/organization") ? "/organization/messages" : "/applicant/messages";
  const { messages, appendOptimisticMessage } = useRealtimeChat(conversationId, initialMessages);
  const [draft, setDraft] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setDraft("");
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.data) throw new Error(result?.message ?? "تعذّر إرسال الرسالة");
      appendOptimisticMessage(result.data);
    } catch (error) {
      setDraft(content);
      toast({ variant: "error", title: "لم تُرسل الرسالة", description: error instanceof Error ? error.message : "تحقق من اتصالك وحاول مرة أخرى." });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-[620px] flex-col overflow-hidden bg-surface">
      {(participantName || opportunityTitle) && <div className="flex items-center gap-3 border-b border-neutral-200 bg-surface px-4 py-3"><Link href={messagesPath} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 md:hidden" aria-label="العودة إلى المحادثات"><ArrowRight className="h-4 w-4 rtl-flip" /></Link><div><p className="text-body-sm font-semibold text-neutral-900">{participantName}</p><p className="text-caption text-secondary">{opportunityTitle}</p></div></div>}
      <div className="chat-surface flex-1 space-y-3 overflow-y-auto p-4 md:p-6">
        {messages.length === 0 && <p className="py-12 text-center text-body-sm text-secondary">ابدأ المحادثة بإرسال أول رسالة.</p>}
        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={cn("flex", isOwnMessage ? "justify-start" : "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-body-sm shadow-xs sm:max-w-[72%]",
                  isOwnMessage
                    ? "rounded-es-sm bg-primary-600 !text-white dark:bg-primary-300"
                    : "rounded-ee-sm bg-surface text-neutral-800"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <span className={cn("mt-1 flex items-center gap-1 text-[10px]", isOwnMessage ? "text-primary-100" : "text-neutral-400")}>
                  {new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}
                  {isOwnMessage && message.isRead && <CheckCheck className="h-3 w-3" aria-label="مقروءة" />}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-neutral-200 bg-neutral-50 p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="اكتب رسالتك..."
          disabled={isSending}
          maxLength={2000}
          rows={2}
          className="min-h-11 resize-none"
        />
        <Button size="icon" onClick={handleSend} isLoading={isSending} aria-label="إرسال">
          {!isSending && <Send className="h-4 w-4 rtl-flip" />}
        </Button>
      </div>
      <span className="px-3 pb-2 text-start text-[10px] text-neutral-400" aria-live="polite">{draft.length}/2000</span>
    </div>
  );
}
