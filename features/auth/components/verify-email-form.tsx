"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Pencil, X } from "lucide-react";
import { sendEmailVerification, verifyBeforeUpdateEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { firebaseAuthReady, firebaseClientAuth } from "@/lib/firebase/client";
import { clearPostProfileRedirect, clearVerificationContext, createBetterAuthSession, firebaseErrorMessage, getVerificationContext, resolvePostAuthPath, type RegistrationRole } from "@/lib/firebase/auth-flow";
import { USER_ROLES } from "@/lib/constants";
import { InlineFeedback } from "@/components/shared/inline-feedback";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? firebaseClientAuth.currentUser?.email ?? "";
  const [verificationContext, setVerificationContext] = React.useState<ReturnType<typeof getVerificationContext>>(null);
  const queryMode = searchParams.get("mode");
  const mode = queryMode === "login" || queryMode === "register" ? queryMode : verificationContext?.mode ?? "register";
  const queryRole = searchParams.get("role");
  const role = (queryRole === USER_ROLES.ORGANIZATION || queryRole === USER_ROLES.APPLICANT
    ? queryRole
    : verificationContext?.role ?? USER_ROLES.APPLICANT) as RegistrationRole;
  const isLogin = mode === "login";
  const redirectTo = searchParams.get("redirectTo") ?? verificationContext?.redirectTo;
  const [email, setEmail] = React.useState(initialEmail);
  const [newEmail, setNewEmail] = React.useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = React.useState(false);
  const [isChangingEmail, setIsChangingEmail] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [isSessionMissing, setIsSessionMissing] = React.useState(false);
  const [verificationError, setVerificationError] = React.useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = React.useState<{ variant: "error" | "success" | "info"; title: string; message: string } | null>(null);
  const verificationInFlight = React.useRef(false);
  const verificationComplete = React.useRef(false);
  const betterAuthSessionCreated = React.useRef(false);

  React.useEffect(() => {
    setVerificationContext(getVerificationContext());
  }, []);

  const verificationPath = React.useCallback((targetEmail: string) => {
    const params = new URLSearchParams({ mode, email: targetEmail });
    if (!isLogin) params.set("role", role);
    if (redirectTo) params.set("redirectTo", redirectTo);
    return `/verify-email?${params.toString()}`;
  }, [isLogin, mode, redirectTo, role]);

  const finishVerification = React.useCallback(async () => {
    if (verificationComplete.current) return true;
    if (verificationInFlight.current) return false;
    verificationInFlight.current = true;
    try {
      await firebaseAuthReady;
      const user = firebaseClientAuth.currentUser;
      if (!user) {
        setIsSessionMissing(true);
        throw new Error("انتهت جلسة المصادقة في هذا المتصفح. سجّل الدخول لإكمال التحقق.");
      }
      setIsSessionMissing(false);
      await user.reload();
      if (!user.emailVerified) return false;
      if (!betterAuthSessionCreated.current) {
        await createBetterAuthSession("email", await user.getIdToken(true), isLogin ? undefined : role);
        betterAuthSessionCreated.current = true;
      }
      const destination = await resolvePostAuthPath(redirectTo);
      clearVerificationContext();
      sessionStorage.removeItem("fursa-registration-role");
      if (!destination.endsWith("/profile")) clearPostProfileRedirect();
      verificationComplete.current = true;
      window.location.replace(destination);
      return true;
    } finally {
      verificationInFlight.current = false;
    }
  }, [isLogin, redirectTo, role]);

  React.useEffect(() => {
    let cancelled = false;
    let timeout: number | undefined;
    const poll = async () => {
      if (cancelled) return;
      try {
        const done = await finishVerification();
        if (!done && !cancelled) timeout = window.setTimeout(poll, 3000);
      } catch (error) {
        setVerificationError(firebaseErrorMessage(error));
      }
    };
    timeout = window.setTimeout(poll, 1500);
    return () => {
      cancelled = true;
      if (timeout) window.clearTimeout(timeout);
    };
  }, [finishVerification]);

  async function checkNow() {
    setIsChecking(true);
    setVerificationError(null);
    setActionFeedback(null);
    try {
      if (!(await finishVerification())) {
        setActionFeedback({ variant: "info", title: "لم يكتمل التحقق بعد", message: "افتح رابط التحقق في بريدك الإلكتروني، ثم ارجع إلى هذه الصفحة." });
      }
    } catch (error) {
      setVerificationError(firebaseErrorMessage(error));
    } finally {
      setIsChecking(false);
    }
  }

  async function resend() {
    await firebaseAuthReady;
    const user = firebaseClientAuth.currentUser;
    setActionFeedback(null);
    if (!user) {
      setActionFeedback({ variant: "error", title: "انتهت جلسة التسجيل", message: "ارجع إلى صفحة التسجيل وحاول مرة أخرى." });
      return;
    }
    setIsResending(true);
    try {
      firebaseClientAuth.languageCode = "ar";
      const settings = { url: `${window.location.origin}${verificationPath(email)}` };
      if (email !== user.email) await verifyBeforeUpdateEmail(user, email, settings);
      else await sendEmailVerification(user, settings);
      setActionFeedback({ variant: "success", title: "أُرسل رابط تحقق جديد", message: "راجع صندوق الوارد والبريد غير المرغوب فيه." });
    } catch (error) {
      setActionFeedback({ variant: "error", title: "تعذّر إرسال الرابط", message: firebaseErrorMessage(error) });
    } finally {
      setIsResending(false);
    }
  }

  async function changeEmail(event: React.FormEvent) {
    event.preventDefault();
    await firebaseAuthReady;
    const user = firebaseClientAuth.currentUser;
    const normalizedEmail = newEmail.trim().toLowerCase();
    setActionFeedback(null);
    if (!user) {
      setActionFeedback({ variant: "error", title: "انتهت جلسة التسجيل", message: "ارجع إلى صفحة التسجيل وحاول مرة أخرى." });
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
        url: `${window.location.origin}${verificationPath(normalizedEmail)}`,
      });
      setEmail(normalizedEmail);
      setIsEditingEmail(false);
      window.history.replaceState(null, "", verificationPath(normalizedEmail));
      setActionFeedback({ variant: "success", title: "أُرسل الرابط إلى البريد الجديد", message: "لن يتغير بريد الحساب حتى تفتح رابط التحقق." });
    } catch (error) {
      setActionFeedback({ variant: "error", title: "تعذّر تغيير البريد", message: firebaseErrorMessage(error) });
    } finally {
      setIsChangingEmail(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-surface p-6 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700"><Mail className="h-6 w-6" /></div>
      <div><h1 className="text-h3 text-neutral-900">تحقق من بريدك الإلكتروني</h1><p className="mt-2 text-body-sm text-secondary">أرسلنا رابط تحقق إلى <span dir="ltr" className="font-medium text-neutral-800">{email}</span></p></div>
      {isSessionMissing ? <>
        <p className="text-body-sm text-secondary">تم التحقق من الرابط في متصفح لا يحتوي على جلسة المصادقة. سجّل الدخول بالحساب نفسه للمتابعة.</p>
        <Button asChild size="lg"><Link href={redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login"}>الانتقال إلى تسجيل الدخول</Link></Button>
      </> : <>
        {verificationError ? <InlineFeedback title="تعذّر إكمال التحقق" message={verificationError} /> : null}
        {actionFeedback ? <InlineFeedback variant={actionFeedback.variant} title={actionFeedback.title} message={actionFeedback.message} /> : null}
        {isEditingEmail ? <form onSubmit={changeEmail} className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-start"><Label htmlFor="corrected-email">البريد الإلكتروني الصحيح</Label><Input id="corrected-email" type="email" dir="ltr" autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required className="mt-2" /><div className="mt-3 flex gap-2"><Button type="submit" size="sm" isLoading={isChangingEmail}>إرسال رابط التحقق</Button><Button type="button" size="icon" variant="ghost" aria-label="إلغاء" onClick={() => { setNewEmail(email); setIsEditingEmail(false); }}><X className="h-4 w-4" /></Button></div></form> : <Button type="button" variant="outline" onClick={() => setIsEditingEmail(true)}><Pencil className="h-4 w-4" />هل البريد غير صحيح؟ تعديله</Button>}
        <Button type="button" size="lg" onClick={checkNow} isLoading={isChecking}>تحققت من بريدي</Button>
        <Button type="button" variant="ghost" onClick={resend} isLoading={isResending}>إعادة إرسال الرابط</Button>
      </>}
    </div>
  );
}
