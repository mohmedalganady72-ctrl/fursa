"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

/** نموذج إرسال إشعار موجّه لفئة كاملة من المستخدمين (راجع حالات الاستخدام § 10) */
export function BroadcastForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [audience, setAudience] = React.useState("both");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [sendEmail, setSendEmail] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, title, body, sendEmail }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        toast({ variant: "error", title: "تعذّر إرسال الإشعار", description: result?.message ?? result?.error ?? "تعذّر الاتصال بالخادم" });
        return;
      }

      toast({
        variant: result.data.emailFailureCount ? "info" : "success",
        title: `تم إرسال الإشعار إلى ${result.data.recipientCount} مستخدم`,
        description: result.data.emailFailureCount ? `تعذّر إرسال البريد إلى ${result.data.emailFailureCount} مستخدم، لكن الإشعارات داخل المنصة وصلت` : undefined,
      });
      setTitle("");
      setBody("");
    } catch (error) {
      toast({ variant: "error", title: "تعذّر إرسال الإشعار", description: error instanceof Error ? error.message : "تحقق من الاتصال وحاول مجدداً" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="audience">الفئة المستهدَفة</Label>
        <Select value={audience} onValueChange={setAudience}>
          <SelectTrigger id="audience" className="sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="applicants">الباحثون عن فرص فقط</SelectItem>
            <SelectItem value="organizations">الجهات فقط</SelectItem>
            <SelectItem value="both">كلاهما معًا</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">عنوان الإشعار</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">نص الإشعار</Label>
        <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} required minLength={10} className="min-h-28" />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="sendEmail" checked={sendEmail} onCheckedChange={(v) => setSendEmail(!!v)} />
        <Label htmlFor="sendEmail">إرسال بريد إلكتروني بالتوازي مع الإشعار داخل النظام</Label>
      </div>

      <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">
        إرسال الإشعار
      </Button>
    </form>
  );
}
