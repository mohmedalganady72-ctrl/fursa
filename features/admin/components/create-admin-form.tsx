"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/** نموذج إنشاء حساب مدير جديد من داخل لوحة التحكم (راجع حالات الاستخدام § "إنشاء حساب مدير") */
export function CreateAdminForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "error", title: "كلمتا المرور غير متطابقتين" });
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
        toast({ variant: "error", title: "تعذّر إنشاء الحساب", description: result.message ?? "حاول مرة أخرى" });
        return;
      }

      toast({ variant: "success", title: "تم إنشاء حساب المدير الجديد" });
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
        <PasswordInput id="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
      </div>
      <Button type="submit" isLoading={isSubmitting} className="mt-2">
        إنشاء حساب المدير
      </Button>
    </form>
  );
}
