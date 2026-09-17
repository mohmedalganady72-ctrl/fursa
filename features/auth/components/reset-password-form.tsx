"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth/client";
import { firebaseErrorMessage } from "@/lib/firebase/auth-flow";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") ?? "";
  const router = useRouter(); const { toast } = useToast();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true);
    try {
      if (!oobCode) { toast({ variant: "error", title: "رابط الاستعادة غير صالح", description: "اطلب رابطًا جديدًا وحاول مرة أخرى." }); return; }
      if (password !== confirmPassword) { toast({ variant: "error", title: "كلمتا المرور غير متطابقتين" }); return; }
      const { error } = await authClient.confirmPasswordReset({ oobCode, newPassword: password });
      if (error) throw new Error(error.message);
      toast({ variant: "success", title: "تغيّرت كلمة المرور بنجاح" }); router.push("/login");
    } catch (error) {
      toast({ variant: "error", title: "تعذّر تغيير كلمة المرور", description: firebaseErrorMessage(error) });
    } finally { setPending(false); }
  }
  return <form onSubmit={submit} className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-surface p-6 shadow-sm">
    <h1 className="text-h3 text-neutral-900">كلمة مرور جديدة</h1>
    <div className="flex flex-col gap-2"><Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
      <PasswordInput id="newPassword" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></div>
    <div className="flex flex-col gap-2"><Label htmlFor="confirmNewPassword">تأكيد كلمة المرور</Label>
      <PasswordInput id="confirmNewPassword" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
    <Button type="submit" size="lg" isLoading={pending}>حفظ كلمة المرور</Button>
  </form>;
}
