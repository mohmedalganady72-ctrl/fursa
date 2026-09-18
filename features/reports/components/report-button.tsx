"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InlineFeedback } from "@/components/shared/inline-feedback";
import { useToast } from "@/hooks/use-toast";

const REASONS = {
  misleading: "معلومات مضللة أو غير صحيحة",
  inappropriate: "محتوى أو سلوك غير لائق",
  fraud: "اشتباه في احتيال أو انتحال",
  harassment: "إساءة أو مضايقة",
  other: "سبب آخر",
} as const;

export function ReportButton({ targetId, targetLabel }: { targetId: string; targetLabel: string }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<keyof typeof REASONS>("misleading");
  const [details, setDetails] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function submit() {
    setPending(true);
    setErrorMessage(null);
    try {
      const description = `${REASONS[reason]}${details.trim() ? `\n${details.trim()}` : ""}`;
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "user", targetId, reason: description }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message ?? "تعذّر إرسال البلاغ");
      toast({ variant: "success", title: "أُرسل البلاغ", description: "سيراجعه فريق إدارة المنصة." });
      setOpen(false);
      setDetails("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تعذّر إرسال البلاغ. حاول مرة أخرى.");
    } finally {
      setPending(false);
    }
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><ShieldAlert className="h-4 w-4" />إبلاغ</Button></DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>إبلاغ عن {targetLabel}</DialogTitle><DialogDescription>سيصل البلاغ إلى إدارة المنصة بسرية لمراجعته.</DialogDescription></DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2"><Label>سبب البلاغ</Label><Select value={reason} onValueChange={(value) => setReason(value as keyof typeof REASONS)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(REASONS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="report-details">تفاصيل إضافية (اختياري)</Label><Textarea id="report-details" value={details} onChange={(event) => setDetails(event.target.value)} maxLength={400} placeholder="أضف معلومات تساعد فريق الإدارة على مراجعة البلاغ." /></div>
      </div>
      {errorMessage ? <InlineFeedback title="تعذّر إرسال البلاغ" message={errorMessage} className="mt-4" /> : null}
      <DialogFooter><Button type="button" variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button><Button type="button" variant="danger" onClick={submit} isLoading={pending}>إرسال البلاغ</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
