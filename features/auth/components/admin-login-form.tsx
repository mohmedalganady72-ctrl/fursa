"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { signIn } from "@/lib/auth/client";

/**
 * نموذج دخول مدير المنصة — منفصل تمامًا عن نموذج الدخول العام (LoginForm)
 * رغم تشابه الحقول، لأن هذه الصفحة على رابط خاص غير معلَن في أي تنقل عام
 * (راجع حالات الاستخدام § "لديه رابط خاص وصفحة دخول خاصة")، ويُعاد التوجيه
 * دائمًا إلى /admin/dashboard مباشرة بغضّ النظر عن أي redirectTo.
 */
export function AdminLoginForm() {
  const { toast } = useToast();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await signIn.email({ email, password });

      if (error) {
        toast({ variant: "error", title: "بيانات الدخول غير صحيحة" });
        return;
      }

      window.location.replace("/admin/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-surface p-6 shadow-sm">
      <div>
        <h1 className="text-h3 text-neutral-900">تسجيل دخول مدير المنصة</h1>
        <p className="mt-1 text-body-sm text-secondary">هذه الصفحة مخصّصة لفريق إدارة المنصة فقط.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="adminEmail">البريد الإلكتروني</Label>
        <Input id="adminEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="adminPassword">كلمة المرور</Label>
        <PasswordInput id="adminPassword" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>

      <Button type="submit" size="lg" isLoading={isSubmitting}>
        تسجيل الدخول
      </Button>
    </form>
  );
}
