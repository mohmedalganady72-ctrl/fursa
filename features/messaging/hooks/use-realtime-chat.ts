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
          setMessages((current) => current.some((message) => message.id === payload.new.id)
            ? current : [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      const response = await fetch(`/api/messages/${conversationId}`);
      if (response.ok) setMessages((await response.json()).data);
    };
    const interval = window.setInterval(refresh, 10_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [conversationId]);

  const appendOptimisticMessage = useCallback((message: Message) => {
    // يُستخدم لعرض رسالة المستخدم نفسه فورًا قبل تأكيد الخادم (تجربة استخدام أسرع)
    setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
  }, []);

  return { messages, appendOptimisticMessage };
}
