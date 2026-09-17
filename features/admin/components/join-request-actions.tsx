"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

/** أزرار اعتماد/رفض طلب انضمام جهة — الرفض يفتح نافذة لسبب اختياري يُعرَض للجهة */
export function JoinRequestActions({ organizationProfileId }: { organizationProfileId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);

  async function submitDecision(decision: "approve" | "reject") {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/organizations/${organizationProfileId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rejectionReason: decision === "reject" ? rejectionReason : undefined }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast({ variant: "error", title: "تعذّر تنفيذ الإجراء", description: result?.message ?? result?.error ?? "تعذّر الاتصال بالخادم" });
        return;
      }

      toast({ variant: "success", title: decision === "approve" ? "تم اعتماد الجهة" : "تم رفض الطلب" });
      setIsRejectDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast({ variant: "error", title: "تعذّر تنفيذ الإجراء", description: error instanceof Error ? error.message : "تحقق من الاتصال وحاول مجدداً" });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={() => submitDecision("approve")} isLoading={isProcessing}>
        <Check className="h-4 w-4" /> اعتماد
      </Button>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <X className="h-4 w-4 text-danger-500" /> رفض
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض طلب الانضمام</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">سبب الرفض (اختياري، يُعرَض للجهة)</Label>
            <Textarea id="reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>إلغاء</Button>
            <Button variant="danger" onClick={() => submitDecision("reject")} isLoading={isProcessing}>
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
