"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Smartphone } from "lucide-react";
import { GoogleAuthProvider, RecaptchaVerifier, signInWithEmailAndPassword, signInWithPhoneNumber, signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { firebaseAuthReady, firebaseClientAuth } from "@/lib/firebase/client";
import { clearPostProfileRedirect, clearVerificationContext, createBetterAuthSession, firebaseErrorMessage, rememberLoginVerification, resolvePostAuthPath, signInWithPassword } from "@/lib/firebase/auth-flow";
import { CountryPhoneInput } from "@/features/auth/components/country-phone-input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [method, setMethod] = React.useState<"email" | "phone">("email");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const authActionInFlight = React.useRef(false);
  const redirectTo = searchParams.get("redirectTo") ?? undefined;

  async function finish(provider: "email" | "google", idToken: string) {
    clearVerificationContext();
    clearPostProfileRedirect();
    await createBetterAuthSession(provider, idToken);
    window.location.replace(await resolvePostAuthPath(redirectTo));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (authActionInFlight.current) return;
    authActionInFlight.current = true;
    setIsSubmitting(true);
    try {
      await firebaseAuthReady;
      if (method === "email") {
        try {
          const credential = await signInWithEmailAndPassword(firebaseClientAuth, email, password);
          if (!credential.user.emailVerified) {
            rememberLoginVerification(redirectTo);
            router.push(`/verify-email?mode=login&email=${encodeURIComponent(email)}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ""}`);
            return;
          }
          await finish("email", await credential.user.getIdToken());
        } catch (firebaseError) {
          // يسمح للحسابات المنشأة قبل نقل المصادقة إلى Firebase بتسجيل الدخول ثم ترحيلها تدريجياً.
          if (!canTryLegacyLogin(firebaseError)) throw firebaseError;
          const legacy = await signInWithPassword(email, password);
          if (legacy.error) throw firebaseError;
          clearVerificationContext();
          clearPostProfileRedirect();
          window.location.replace(await resolvePostAuthPath(redirectTo));
        }
      } else {
        const verifier = new RecaptchaVerifier(firebaseClientAuth, "firebase-login-recaptcha", { size: "invisible" });
        try {
          const confirmation = await signInWithPhoneNumber(firebaseClientAuth, phone.trim(), verifier);
          sessionStorage.setItem("fursa-phone-verification-id", confirmation.verificationId);
          rememberLoginVerification(redirectTo);
          router.push(`/verify-phone?mode=login&phone=${encodeURIComponent(phone.trim())}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ""}`);
        } finally {
          verifier.clear();
        }
      }
    } catch (error) {
      toast({ variant: "error", title: "تعذّر تسجيل الدخول", description: firebaseErrorMessage(error) });
    } finally {
      authActionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  async function googleLogin() {
    if (authActionInFlight.current) return;
    authActionInFlight.current = true;
    setIsSubmitting(true);
    try {
      await firebaseAuthReady;
      const credential = await signInWithPopup(firebaseClientAuth, new GoogleAuthProvider());
      await finish("google", await credential.user.getIdToken());
    } catch (error) {
      toast({ variant: "error", title: "تعذّر الدخول عبر Google", description: firebaseErrorMessage(error) });
    } finally {
      authActionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-surface p-6 shadow-sm">
      <div><h1 className="text-h3 text-neutral-900">تسجيل الدخول</h1><p className="mt-1 text-body-sm text-secondary">مرحبًا بعودتك</p></div>
      <div className="grid grid-cols-2 rounded-md bg-neutral-100 p-1" role="tablist" aria-label="طريقة تسجيل الدخول">
        <MethodButton active={method === "email"} icon={Mail} label="البريد" onClick={() => setMethod("email")} />
        <MethodButton active={method === "phone"} icon={Smartphone} label="الهاتف" onClick={() => setMethod("phone")} />
      </div>
      {method === "email" ? <>
        <div className="flex flex-col gap-2"><Label htmlFor="login-email">البريد الإلكتروني</Label><Input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
        <div className="flex flex-col gap-2"><Label htmlFor="login-password">كلمة المرور</Label><PasswordInput id="login-password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
      </> : <CountryPhoneInput id="login-phone" value={phone} onChange={setPhone} />}
      <div id="firebase-login-recaptcha" />
      <Button type="submit" size="lg" isLoading={isSubmitting}>تسجيل الدخول</Button>
      {method === "email" && <Link href="/forgot-password" className="text-center text-body-sm font-medium text-primary-600 hover:underline">نسيت كلمة المرور؟</Link>}
      <div className="flex items-center gap-3 text-caption text-secondary before:h-px before:flex-1 before:bg-neutral-200 after:h-px after:flex-1 after:bg-neutral-200">أو</div>
      <Button type="button" variant="outline" size="lg" onClick={googleLogin} disabled={isSubmitting}><span aria-hidden="true" className="text-base font-bold">G</span>المتابعة باستخدام Google</Button>
      <p className="text-center text-body-sm text-secondary">ليس لديك حساب؟ <Link href={redirectTo ? `/register?redirectTo=${encodeURIComponent(redirectTo)}` : "/register"} className="font-medium text-primary-600 hover:underline">إنشاء حساب جديد</Link></p>
    </form>
  );
}

function canTryLegacyLogin(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  return new Set(["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"]).has(String(error.code));
}

function MethodButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Mail; label: string; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`flex h-10 items-center justify-center gap-2 rounded px-3 text-body-sm font-medium transition-colors duration-300 ${active ? "bg-surface text-neutral-900 shadow-sm ring-1 ring-neutral-200" : "text-secondary hover:bg-neutral-200/60 hover:text-neutral-800"}`}><Icon className="h-4 w-4" />{label}</button>;
}
