"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES } from "@/lib/constants";
import { firebaseAuthReady, firebaseClientAuth } from "@/lib/firebase/client";
import { createBetterAuthSession, firebaseErrorMessage, profilePath, resolvePostAuthPath, type RegistrationRole } from "@/lib/firebase/auth-flow";

export function VerifyPhoneForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const phone = searchParams.get("phone") ?? "";
  const isLogin = searchParams.get("mode") === "login";
  const [code, setCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const verificationId = sessionStorage.getItem("fursa-phone-verification-id");
    const role = (sessionStorage.getItem("fursa-registration-role") ?? USER_ROLES.APPLICANT) as RegistrationRole;
    if (!verificationId) {
      toast({ variant: "error", title: "انتهت جلسة التحقق", description: "ارجع إلى التسجيل واطلب كوداً جديداً" });
      return;
    }
    setIsSubmitting(true);
    try {
      await firebaseAuthReady;
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await signInWithCredential(firebaseClientAuth, credential);
      await createBetterAuthSession("phone", await result.user.getIdToken(), isLogin ? undefined : role);
      sessionStorage.removeItem("fursa-phone-verification-id");
      sessionStorage.removeItem("fursa-registration-role");
      const destination = isLogin ? await resolvePostAuthPath(sessionStorage.getItem("fursa-login-redirect") ?? undefined) : profilePath(role);
      sessionStorage.removeItem("fursa-login-redirect");
      window.location.replace(destination);
    } catch (error) {
      toast({ variant: "error", title: "تعذّر التحقق", description: firebaseErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-surface p-6 shadow-sm">
      <div><h1 className="text-h3 text-neutral-900">تأكيد رقم الهاتف</h1><p className="mt-1 text-body-sm text-secondary">أدخل الكود المرسل إلى <span dir="ltr" className="font-medium">{phone}</span></p></div>
      <div className="flex flex-col gap-2"><Label htmlFor="phone-code">كود التحقق</Label><Input id="phone-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} minLength={6} maxLength={6} required className="text-center text-h4 tracking-[0.5em] ltr-numerals" placeholder="000000" /></div>
      <Button type="submit" size="lg" isLoading={isSubmitting}>تأكيد الكود</Button>
    </form>
  );
}
