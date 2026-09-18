"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { InlineFeedback } from "@/components/shared/inline-feedback";

/** نموذج إنشاء حساب مدير جديد من داخل لوحة التحكم (راجع حالات الاستخدام § "إنشاء حساب مدير") */
export function CreateAdminForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [confirmError, setConfirmError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setConfirmError(null);
    if (password !== confirmPassword) {
      setConfirmError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(result.message ?? "تحقق من البيانات، ثم حاول مرة أخرى.");
        return;
      }

      toast({ variant: "success", title: "أُنشئ حساب المدير الجديد" });
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setDisplayName("");
      router.push("/admin/admins");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">الاسم</Label>
        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">كلمة المرور المبدئية</Label>
        <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
        <PasswordInput id="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(null); }} required minLength={8} aria-invalid={Boolean(confirmError)} aria-describedby={confirmError ? "create-admin-confirm-error" : undefined} />
        {confirmError ? <p id="create-admin-confirm-error" role="alert" className="text-body-sm text-danger-500">{confirmError}</p> : null}
      </div>
      {formError ? <InlineFeedback title="تعذّر إنشاء الحساب" message={formError} /> : null}
      <Button type="submit" isLoading={isSubmitting} className="mt-2">
        إنشاء حساب المدير
      </Button>
    </form>
  );
}
