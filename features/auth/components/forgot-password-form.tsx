"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { firebaseErrorMessage } from "@/lib/firebase/auth-flow";
import { InlineFeedback } from "@/components/shared/inline-feedback";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ variant: "error" | "success"; message: string } | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setFeedback(null);
    try {
      const { error } = await authClient.sendPasswordReset({ email });
      if (error) throw new Error(error.message);
      setFeedback({ variant: "success", message: "إذا كان البريد مرتبطًا بحساب، فستصلك رسالة لإعادة تعيين كلمة المرور." });
    } catch (error) {
      setFeedback({ variant: "error", message: firebaseErrorMessage(error) });
    } finally { setPending(false); }
  }
  return <form onSubmit={submit} className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-surface p-6 shadow-sm">
    <div><h1 className="text-h3 text-neutral-900">استعادة كلمة المرور</h1><p className="mt-1 text-body-sm text-secondary">أدخل بريدك الإلكتروني لنرسل إليك رابط إعادة التعيين.</p></div>
    <div className="flex flex-col gap-2"><Label htmlFor="resetEmail">البريد الإلكتروني</Label>
      <Input id="resetEmail" type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setFeedback(null); }} /></div>
    {feedback ? <InlineFeedback variant={feedback.variant} title={feedback.variant === "success" ? "راجع بريدك الإلكتروني" : "تعذّر إرسال الرابط"} message={feedback.message} /> : null}
    <Button type="submit" size="lg" isLoading={pending}>إرسال رابط الاستعادة</Button>
  </form>;
}
