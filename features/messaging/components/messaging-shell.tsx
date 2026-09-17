"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { ConversationList, type ConversationSummary } from "./conversation-list";

export function MessagingShell({ conversations, basePath, children }: { conversations: ConversationSummary[]; basePath: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isIndex = pathname === basePath;
  return <div>
    <h1 className="mb-5 text-h1 text-neutral-900">الرسائل</h1>
    <div className="grid min-h-[620px] overflow-hidden rounded-lg border border-neutral-200 bg-surface shadow-sm md:grid-cols-[320px_minmax(0,1fr)]">
      <aside className={`${isIndex ? "block" : "hidden"} border-e border-neutral-200 md:block`}><div className="border-b border-neutral-200 px-4 py-4"><p className="font-semibold text-neutral-900">المحادثات</p></div><ConversationList conversations={conversations} emptyDescription="لا توجد محادثات بعد" embedded /></aside>
      <section className={`${isIndex ? "hidden" : "block"} min-w-0 md:block`}>
        {isIndex ? <div className="hidden h-full items-center justify-center bg-neutral-50 md:flex"><div className="text-center text-secondary"><MessageCircle className="mx-auto h-10 w-10 text-primary-300" /><p className="mt-3 text-body-sm">اختر محادثة لعرض الرسائل</p></div></div> : children}
      </section>
    </div>
  </div>;
}
