"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/** أزرار القبول/الرفض لصف متقدم واحد — راجع app/api/applications/[id]/decision/route.ts */
export function ApplicantRowActions({ applicationId, canAccept }: { applicationId: string; canAccept: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);

  async function handleDecision(decision: "accept" | "reject") {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast({ variant: "error", title: "تعذّر تنفيذ الإجراء", description: result.message ?? result.error });
        return;
      }

      toast({
        variant: "success",
        title: decision === "accept" ? "تم قبول المتقدم" : "تم رفض المتقدم",
        description: decision === "accept" ? "تم فتح محادثة للتواصل معه" : undefined,
      });
      router.refresh();
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleDecision("accept")}
        disabled={!canAccept || isProcessing}
        title={!canAccept ? "لا توجد مقاعد متاحة" : undefined}
      >
        <Check className="h-4 w-4 text-success-500" />
        قبول
      </Button>
      <Button size="sm" variant="ghost" onClick={() => handleDecision("reject")} disabled={isProcessing}>
        <X className="h-4 w-4 text-danger-500" />
        رفض
      </Button>
    </div>
  );
}
