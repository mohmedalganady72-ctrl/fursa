"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth/client";
import { firebaseErrorMessage } from "@/lib/firebase/auth-flow";
import { InlineFeedback } from "@/components/shared/inline-feedback";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") ?? "";
  const router = useRouter(); const { toast } = useToast();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [confirmError, setConfirmError] = React.useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setFormError(null); setConfirmError(null);
    try {
      if (!oobCode) { setFormError("رابط الاستعادة غير صالح. اطلب رابطًا جديدًا وحاول مرة أخرى."); return; }
      if (password !== confirmPassword) { setConfirmError("كلمتا المرور غير متطابقتين."); return; }
      const { error } = await authClient.confirmPasswordReset({ oobCode, newPassword: password });
      if (error) throw new Error(error.message);
      toast({ variant: "success", title: "تغيّرت كلمة المرور بنجاح" }); router.push("/login");
    } catch (error) {
      setFormError(firebaseErrorMessage(error));
    } finally { setPending(false); }
  }
  return <form onSubmit={submit} className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-surface p-6 shadow-sm">
    <h1 className="text-h3 text-neutral-900">كلمة مرور جديدة</h1>
    <div className="flex flex-col gap-2"><Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
      <PasswordInput id="newPassword" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></div>
    <div className="flex flex-col gap-2"><Label htmlFor="confirmNewPassword">تأكيد كلمة المرور</Label>
      <PasswordInput id="confirmNewPassword" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setConfirmError(null); }} aria-invalid={Boolean(confirmError)} aria-describedby={confirmError ? "confirm-new-password-error" : undefined} />{confirmError ? <p id="confirm-new-password-error" role="alert" className="text-body-sm text-danger-500">{confirmError}</p> : null}</div>
    {formError ? <InlineFeedback title="تعذّر تغيير كلمة المرور" message={formError} /> : null}
    <Button type="submit" size="lg" isLoading={pending}>حفظ كلمة المرور</Button>
  </form>;
}
