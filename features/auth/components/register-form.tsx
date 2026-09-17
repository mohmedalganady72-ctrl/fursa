"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Building2, Mail, Smartphone } from "lucide-react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, RecaptchaVerifier, sendEmailVerification, signInWithPhoneNumber, signInWithPopup, updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES } from "@/lib/constants";
import { firebaseClientAuth } from "@/lib/firebase/client";
import { createBetterAuthSession, firebaseErrorMessage, resolvePostAuthPath, type RegistrationRole } from "@/lib/firebase/auth-flow";
import { CountryPhoneInput } from "@/features/auth/components/country-phone-input";

type RegistrationMethod = "email" | "phone";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const initialRole = searchParams.get("role") === USER_ROLES.ORGANIZATION ? USER_ROLES.ORGANIZATION : USER_ROLES.APPLICANT;
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const [role, setRole] = React.useState<RegistrationRole>(initialRole);
  const [method, setMethod] = React.useState<RegistrationMethod>("email");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function registerWithEmail() {
    if (password !== confirmPassword) throw new Error("كلمتا المرور غير متطابقتين");
    const credential = await createUserWithEmailAndPassword(firebaseClientAuth, email, password);
    await updateProfile(credential.user, { displayName: email.split("@")[0] });
    sessionStorage.setItem("fursa-registration-role", role);
    if (redirectTo) sessionStorage.setItem("fursa-post-profile-redirect", redirectTo);
    firebaseClientAuth.languageCode = "ar";
    await sendEmailVerification(credential.user, {
      url: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`,
      handleCodeInApp: false,
    });
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  async function registerWithPhone() {
    const verifier = new RecaptchaVerifier(firebaseClientAuth, "firebase-recaptcha", { size: "invisible" });
    try {
      const confirmation = await signInWithPhoneNumber(firebaseClientAuth, phone.trim(), verifier);
      sessionStorage.setItem("fursa-phone-verification-id", confirmation.verificationId);
      sessionStorage.setItem("fursa-registration-role", role);
      if (redirectTo) sessionStorage.setItem("fursa-post-profile-redirect", redirectTo);
      router.push(`/verify-phone?phone=${encodeURIComponent(phone.trim())}`);
    } finally {
      verifier.clear();
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await (method === "email" ? registerWithEmail() : registerWithPhone());
    } catch (error) {
      toast({ variant: "error", title: "تعذّر إنشاء الحساب", description: firebaseErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function registerWithGoogle() {
    setIsSubmitting(true);
    try {
      if (redirectTo) sessionStorage.setItem("fursa-post-profile-redirect", redirectTo);
      const credential = await signInWithPopup(firebaseClientAuth, new GoogleAuthProvider());
      await createBetterAuthSession("google", await credential.user.getIdToken(), role);
      sessionStorage.removeItem("fursa-registration-role");
      window.location.replace(await resolvePostAuthPath());
    } catch (error) {
      toast({ variant: "error", title: "تعذّر التسجيل عبر Google", description: firebaseErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-surface p-6 shadow-sm">
      <div><h1 className="text-h3 text-neutral-900">إنشاء حساب جديد</h1><p className="mt-1 text-body-sm text-secondary">اختر نوع الحساب وطريقة التسجيل</p></div>
      <div className="grid grid-cols-2 gap-3">
        <RoleButton active={role === USER_ROLES.APPLICANT} icon={Briefcase} label="باحث عن فرصة" onClick={() => setRole(USER_ROLES.APPLICANT)} />
        <RoleButton active={role === USER_ROLES.ORGANIZATION} icon={Building2} label="جهة" onClick={() => setRole(USER_ROLES.ORGANIZATION)} />
      </div>
      <div className="grid grid-cols-2 rounded-md bg-neutral-100 p-1" role="tablist" aria-label="طريقة التسجيل">
        <MethodButton active={method === "email"} icon={Mail} label="البريد" onClick={() => setMethod("email")} />
        <MethodButton active={method === "phone"} icon={Smartphone} label="الهاتف" onClick={() => setMethod("phone")} />
      </div>
      {method === "email" ? <>
        <Field id="email" label="البريد الإلكتروني"><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field>
        <Field id="password" label="كلمة المرور"><PasswordInput id="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></Field>
        <Field id="confirm-password" label="تأكيد كلمة المرور"><PasswordInput id="confirm-password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} /></Field>
      </> : <CountryPhoneInput id="phone" value={phone} onChange={setPhone} />}
      <div id="firebase-recaptcha" />
      <Button type="submit" size="lg" isLoading={isSubmitting}>إنشاء الحساب</Button>
      <div className="flex items-center gap-3 text-caption text-secondary before:h-px before:flex-1 before:bg-neutral-200 after:h-px after:flex-1 after:bg-neutral-200">أو</div>
      <Button type="button" variant="outline" size="lg" onClick={registerWithGoogle} disabled={isSubmitting}><span aria-hidden="true" className="text-base font-bold">G</span>المتابعة باستخدام Google</Button>
      <p className="text-center text-body-sm text-secondary">لديك حساب بالفعل؟ <Link href="/login" className="font-medium text-primary-600 hover:underline">تسجيل الدخول</Link></p>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><Label htmlFor={id}>{label}</Label>{children}</div>;
}

function RoleButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Briefcase; label: string; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border px-3 transition-colors ${active ? "border-primary-600 bg-primary-50 text-primary-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}><Icon className="h-5 w-5" /><span className="text-body-sm font-medium">{label}</span></button>;
}

function MethodButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Mail; label: string; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`flex h-10 items-center justify-center gap-2 rounded px-3 text-body-sm font-medium transition-colors duration-300 ${active ? "bg-surface text-neutral-900 shadow-sm ring-1 ring-neutral-200" : "text-secondary hover:bg-neutral-200/60 hover:text-neutral-800"}`}><Icon className="h-4 w-4" />{label}</button>;
}
