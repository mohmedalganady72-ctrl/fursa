"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/shared/inline-feedback";

/** أزرار القبول/الرفض لصف متقدم واحد — راجع app/api/applications/[id]/decision/route.ts */
export function ApplicantRowActions({ applicationId, canAccept }: { applicationId: string; canAccept: boolean }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleDecision(decision: "accept" | "reject") {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/applications/${applicationId}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      const result = await response.json();
      if (!response.ok) {
        setErrorMessage(result.message ?? result.error ?? "تعذّر تنفيذ الإجراء.");
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("تعذّر تنفيذ الإجراء. تحقق من اتصالك، ثم حاول مرة أخرى.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2"><div className="flex items-center gap-2">
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
      {errorMessage ? <InlineFeedback message={errorMessage} className="max-w-xs" /> : null}
    </div>
  );
}
