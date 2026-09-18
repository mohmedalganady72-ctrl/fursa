"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/shared/inline-feedback";

export function StartConversationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  async function start() {
    setPending(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "تعذّر فتح المحادثة");
      router.push(`/organization/messages/${result.data.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "حاول مرة أخرى.");
    } finally { setPending(false); }
  }
  return <div className="flex flex-col items-start gap-2"><Button type="button" size="sm" variant="outline" onClick={start} isLoading={pending}><MessageCircle className="h-4 w-4" />مراسلة</Button>{errorMessage ? <InlineFeedback title="تعذّر فتح المحادثة" message={errorMessage} /> : null}</div>;
}
