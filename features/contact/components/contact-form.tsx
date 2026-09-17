"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm({ contactEmail }: { contactEmail?: string }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!contactEmail) return;
    const subject = encodeURIComponent(`رسالة من ${name} عبر منصة فرص`);
    const body = encodeURIComponent(`الاسم: ${name}\nالبريد الإلكتروني: ${email}\n\n${message}`);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  }

  return <form onSubmit={submit} className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="contact-name">الاسم</Label><Input id="contact-name" value={name} onChange={(event) => setName(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="contact-email">البريد الإلكتروني</Label><Input id="contact-email" type="email" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} required /></div></div>
    <div className="space-y-2"><Label htmlFor="contact-message">كيف يمكننا مساعدتك؟</Label><Textarea id="contact-message" value={message} onChange={(event) => setMessage(event.target.value)} required minLength={20} className="min-h-40" /></div>
    <Button type="submit" size="lg" disabled={!contactEmail}><Send className="h-4 w-4 rtl-flip" />إرسال عبر البريد</Button>
    {!contactEmail ? <p className="text-body-sm text-warning-500">بريد الدعم غير متاح حاليًا.</p> : null}
  </form>;
}
