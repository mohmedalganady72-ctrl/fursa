"use client";

import * as React from "react";
import { Copy, Mail, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export function ShareOpportunityButton({ opportunityId, title }: { opportunityId: string; title: string }) {
  const { toast } = useToast();
  const [url, setUrl] = React.useState("");
  React.useEffect(() => setUrl(`${window.location.origin}/applicant/opportunities/${opportunityId}`), [opportunityId]);
  const text = `فرصة: ${title}`;

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(url);
    toast({ variant: "success", title: "تم نسخ رابط الفرصة" });
  }

  return <Dialog>
    <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><Share2 className="h-4 w-4" />مشاركة</Button></DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>مشاركة الفرصة</DialogTitle><DialogDescription>من يفتح الرابط سيسجّل الدخول أولًا إن لم تكن لديه جلسة، ثم ينتقل إلى الفرصة مباشرة.</DialogDescription></DialogHeader>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={share}><Share2 className="h-4 w-4" />مشاركة عبر الجهاز</Button>
        <Button variant="outline" asChild><a href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />واتساب</a></Button>
        <Button variant="outline" asChild><a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n${url}`)}`}><Mail className="h-4 w-4" />البريد الإلكتروني</a></Button>
        <Button type="button" variant="outline" onClick={async () => { await navigator.clipboard.writeText(url); toast({ variant: "success", title: "تم نسخ الرابط" }); }}><Copy className="h-4 w-4" />نسخ الرابط</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
