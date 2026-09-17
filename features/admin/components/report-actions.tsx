"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  async function update(status: "reviewed" | "dismissed") {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, { method: "PATCH",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error();
      toast({ variant: "success", title: status === "reviewed" ? "تمت معالجة البلاغ" : "أُغلق البلاغ دون إجراء" });
      router.refresh();
    } catch {
      toast({ variant: "error", title: "تعذّر تحديث البلاغ" });
    } finally { setPending(false); }
  }
  return <div className="flex gap-2">
    <Button size="sm" onClick={() => update("reviewed")} disabled={pending}><Check className="h-4 w-4" /> معالجة</Button>
    <Button size="sm" variant="outline" onClick={() => update("dismissed")} disabled={pending}><X className="h-4 w-4" /> تجاهل</Button>
  </div>;
}
