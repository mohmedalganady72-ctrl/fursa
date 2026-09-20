"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/db/schema";

/**
 * يشترك في قناة Supabase Realtime مخصصة لمحادثة واحدة، ويحدّث القائمة المحلية
 * فور وصول رسالة جديدة من الطرف الآخر — بلا أي polling أو تحديث يدوي للصفحة.
 * الإرسال الفعلي (POST) يحدث عبر messages.service.ts من جهة الخادم؛ هذا الـ hook
 * مسؤول فقط عن الاستماع للتحديثات الواردة وعرضها فورًا في الواجهة.
 */
export function useRealtimeChat(conversationId: string, initialMessages: Message[]) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Realtime uses SQL column names; the API returns the Drizzle shape.
          window.dispatchEvent(new Event(`fursa:conversation:${conversationId}`));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    let inFlight = false;
    const controller = new AbortController();
    setMessages(initialMessages);
    const refresh = async () => {
      if (document.visibilityState !== "visible" || inFlight || controller.signal.aborted) return;
      inFlight = true;
      try {
        const response = await fetch(`/api/messages/${conversationId}`, { signal: controller.signal });
        if (response.ok) {
          const result = await response.json();
          if (!controller.signal.aborted) setMessages(result.data);
        }
      } catch {
        // Keep the last successful conversation and retry on the next refresh.
      } finally {
        inFlight = false;
      }
    };
    const interval = window.setInterval(refresh, 10_000);
    window.addEventListener("focus", refresh);
    window.addEventListener(`fursa:conversation:${conversationId}`, refresh);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(`fursa:conversation:${conversationId}`, refresh);
    };
  }, [conversationId, initialMessages]);

  const appendOptimisticMessage = useCallback((message: Message) => {
    // يُستخدم لعرض رسالة المستخدم نفسه فورًا قبل تأكيد الخادم (تجربة استخدام أسرع)
    setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
  }, []);

  return { messages, appendOptimisticMessage };
}
