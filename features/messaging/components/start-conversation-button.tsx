"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function StartConversationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  async function start() {
    setPending(true);
    try {
      const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "تعذّر فتح المحادثة");
      router.push(`/organization/messages/${result.data.id}`);
    } catch (error) {
      toast({ variant: "error", title: "تعذّر فتح المحادثة", description: error instanceof Error ? error.message : "حاول مرة أخرى." });
    } finally { setPending(false); }
  }
  return <Button type="button" size="sm" variant="outline" onClick={start} isLoading={pending}><MessageCircle className="h-4 w-4" />مراسلة</Button>;
}
