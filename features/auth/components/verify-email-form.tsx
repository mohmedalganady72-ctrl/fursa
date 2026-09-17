"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, Pencil, X } from "lucide-react";
import { sendEmailVerification, verifyBeforeUpdateEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { firebaseClientAuth } from "@/lib/firebase/client";
import { createBetterAuthSession, firebaseErrorMessage, profilePath, resolvePostAuthPath, type RegistrationRole } from "@/lib/firebase/auth-flow";
import { USER_ROLES } from "@/lib/constants";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const initialEmail = searchParams.get("email") ?? firebaseClientAuth.currentUser?.email ?? "";
  const google = searchParams.get("provider") === "google";
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const [email, setEmail] = React.useState(initialEmail);
  const [newEmail, setNewEmail] = React.useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = React.useState(false);
  const [isChangingEmail, setIsChangingEmail] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const verificationInFlight = React.useRef(false);
  const verificationComplete = React.useRef(false);

  const finishVerification = React.useCallback(async () => {
    if (verificationComplete.current) return true;
    if (verificationInFlight.current) return false;
    verificationInFlight.current = true;
    try {
      const role = (sessionStorage.getItem("fursa-registration-role") ?? USER_ROLES.APPLICANT) as RegistrationRole;
      if (google) {
        verificationComplete.current = true;
        window.location.replace(profilePath(role));
        return true;
      }

      const user = firebaseClientAuth.currentUser;
      if (!user) throw new Error("انتهت جلسة التسجيل. سجّل الدخول بالبريد بعد فتح رابط التحقق.");
      await user.reload();
      if (!user.emailVerified) return false;
      await createBetterAuthSession("email", await user.getIdToken(true), role);
      verificationComplete.current = true;
      sessionStorage.removeItem("fursa-registration-role");
      window.location.replace(redirectTo ? await resolvePostAuthPath(redirectTo) : profilePath(role));
      return true;
    } finally {
      verificationInFlight.current = false;
    }
  }, [google, redirectTo]);

  React.useEffect(() => {
    if (google) {
      const timeout = window.setTimeout(() => void finishVerification(), 900);
      return () => window.clearTimeout(timeout);
    }
    let cancelled = false;
    let timeout: number | undefined;
    const poll = async () => {
      if (cancelled) return;
      const done = await finishVerification().catch(() => false);
      if (!done && !cancelled) timeout = window.setTimeout(poll, 3000);
    };
    timeout = window.setTimeout(poll, 1500);
    return () => {
      cancelled = true;
      if (timeout) window.clearTimeout(timeout);
    };
  }, [finishVerification, google]);

  async function checkNow() {
    setIsChecking(true);
    try {
      if (!(await finishVerification())) {
        toast({ variant: "info", title: "لم يتم التحقق بعد", description: "افتح الرابط في بريدك ثم عُد إلى هذه الصفحة" });
      }
    } catch (error) {
      toast({ variant: "error", title: "تعذّر إكمال التحقق", description: firebaseErrorMessage(error) });
    } finally {
      setIsChecking(false);
    }
  }

  async function resend() {
    const user = firebaseClientAuth.currentUser;
    if (!user) {
      toast({ variant: "error", title: "انتهت جلسة التسجيل", description: "ارجع إلى صفحة التسجيل وحاول مجدداً" });
      return;
    }
    setIsResending(true);
    try {
      firebaseClientAuth.languageCode = "ar";
      const settings = { url: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ""}` };
      if (email !== user.email) await verifyBeforeUpdateEmail(user, email, settings);
      else await sendEmailVerification(user, settings);
      toast({ variant: "success", title: "أُرسل رابط تحقق جديد" });
    } catch (error) {
      toast({ variant: "error", title: "تعذّر إرسال الرابط", description: firebaseErrorMessage(error) });
    } finally {
      setIsResending(false);
    }
  }

  async function changeEmail(event: React.FormEvent) {
    event.preventDefault();
    const user = firebaseClientAuth.currentUser;
    const normalizedEmail = newEmail.trim().toLowerCase();
    if (!user) {
      toast({ variant: "error", title: "انتهت جلسة التسجيل", description: "ارجع إلى صفحة التسجيل وحاول مجدداً" });
      return;
    }
    if (!normalizedEmail || normalizedEmail === email) {
      setIsEditingEmail(false);
      return;
    }
    setIsChangingEmail(true);
    try {
      firebaseClientAuth.languageCode = "ar";
      await verifyBeforeUpdateEmail(user, normalizedEmail, {
        url: `${window.location.origin}/verify-email?email=${encodeURIComponent(normalizedEmail)}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
      });
      setEmail(normalizedEmail);
      setIsEditingEmail(false);
      window.history.replaceState(null, "", `/verify-email?email=${encodeURIComponent(normalizedEmail)}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ""}`);
      toast({ variant: "success", title: "أُرسل الرابط إلى البريد الجديد", description: "لن يتغير بريد الحساب حتى تفتح رابط التحقق" });
    } catch (error) {
      toast({ variant: "error", title: "تعذّر تغيير البريد", description: firebaseErrorMessage(error) });
    } finally {
      setIsChangingEmail(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-surface p-6 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">{google ? <CheckCircle2 className="h-6 w-6" /> : <Mail className="h-6 w-6" />}</div>
      <div><h1 className="text-h3 text-neutral-900">{google ? "تم التحقق عبر Google" : "تحقق من بريدك الإلكتروني"}</h1><p className="mt-2 text-body-sm text-secondary">{google ? "يتم الآن تجهيز حسابك ونقلك إلى ملفك الشخصي" : <>أرسل فرص رابط تحقق إلى <span dir="ltr" className="font-medium text-neutral-800">{email}</span></>}</p></div>
      {!google && <>
        {isEditingEmail ? <form onSubmit={changeEmail} className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-start"><Label htmlFor="corrected-email">البريد الإلكتروني الصحيح</Label><Input id="corrected-email" type="email" dir="ltr" autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required className="mt-2" /><div className="mt-3 flex gap-2"><Button type="submit" size="sm" isLoading={isChangingEmail}>إرسال للرابط الجديد</Button><Button type="button" size="icon" variant="ghost" aria-label="إلغاء" onClick={() => { setNewEmail(email); setIsEditingEmail(false); }}><X className="h-4 w-4" /></Button></div></form> : <Button type="button" variant="outline" onClick={() => setIsEditingEmail(true)}><Pencil className="h-4 w-4" />البريد غير صحيح؟ تغييره</Button>}
        <Button type="button" size="lg" onClick={checkNow} isLoading={isChecking}>تحققت الآن</Button>
        <Button type="button" variant="ghost" onClick={resend} isLoading={isResending}>إعادة إرسال الرابط</Button>
      </>}
    </div>
  );
}
