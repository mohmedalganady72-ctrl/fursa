"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { InlineFeedback } from "@/components/shared/inline-feedback";
import { authClient } from "@/lib/auth/client";
import { resolvePostAuthPath, signInWithPassword } from "@/lib/firebase/auth-flow";

/**
 * نموذج دخول مدير المنصة — منفصل تمامًا عن نموذج الدخول العام (LoginForm)
 * رغم تشابه الحقول، لأن هذه الصفحة على رابط خاص غير معلَن في أي تنقل عام
 * (راجع حالات الاستخدام § "لديه رابط خاص وصفحة دخول خاصة")، ويُعاد التوجيه
 * ويتحقق بعد إنشاء الجلسة من أن الوجهة الفعلية تخص مديرًا قبل فتح لوحة الإدارة.
 */
export function AdminLoginForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => setIsHydrated(true), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const { error } = await signInWithPassword(email, password);

      if (error) {
        setFeedback("تأكد من البريد الإلكتروني وكلمة المرور، ثم حاول مرة أخرى.");
        return;
      }

      const destination = await resolvePostAuthPath();
      if (!destination.startsWith("/admin/")) {
        await authClient.signOut({ disableRedirect: true, fetchOptions: { timeout: 20_000 } });
        setFeedback("هذا الحساب غير مخوّل للدخول إلى لوحة إدارة المنصة.");
        return;
      }

      window.location.replace(destination);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "تعذّر تسجيل الدخول. حاول مرة أخرى.");
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
        <Input id="adminEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isHydrated || isSubmitting} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="adminPassword">كلمة المرور</Label>
        <PasswordInput id="adminPassword" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!isHydrated || isSubmitting} required />
      </div>

      {feedback ? <InlineFeedback title="تعذّر تسجيل الدخول" message={feedback} /> : null}
      <Button type="submit" size="lg" isLoading={isSubmitting} disabled={!isHydrated || isSubmitting}>
        تسجيل الدخول
      </Button>
    </form>
  );
}
