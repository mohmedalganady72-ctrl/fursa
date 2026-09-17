"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth/client";
import { firebaseErrorMessage } from "@/lib/firebase/auth-flow";

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true);
    try {
      const { error } = await authClient.sendPasswordReset({ email });
      if (error) throw new Error(error.message);
      toast({ variant: "success", title: "تحقق من بريدك", description: "إن كان البريد مسجّلًا فسيصلك رابط إعادة التعيين" });
    } catch (error) {
      toast({ variant: "error", title: "تعذّر إرسال الرابط", description: firebaseErrorMessage(error) });
    } finally { setPending(false); }
  }
  return <form onSubmit={submit} className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-surface p-6 shadow-sm">
    <h1 className="text-h3 text-neutral-900">استعادة كلمة المرور</h1>
    <div className="flex flex-col gap-2"><Label htmlFor="resetEmail">البريد الإلكتروني</Label>
      <Input id="resetEmail" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
    <Button type="submit" size="lg" isLoading={pending}>إرسال رابط الاستعادة</Button>
  </form>;
}
