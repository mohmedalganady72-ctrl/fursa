"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut as signOutFirebase } from "firebase/auth";
import { authClient } from "@/lib/auth/client";
import { firebaseClientAuth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";
import { clearPostProfileRedirect, clearVerificationContext } from "@/lib/firebase/auth-flow";

export function LogoutButton({ showLabel = false, className }: { showLabel?: boolean; className?: string }) {
  const pathname = usePathname();
  const [pending, setPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function logout() {
    if (pending) return;
    setPending(true);
    setErrorMessage(null);
    try {
      const result = await authClient.signOut({ disableRedirect: true, fetchOptions: { timeout: 20_000 } });
      if (result.error) throw new Error("تعذّر تسجيل الخروج. حاول مرة أخرى بعد لحظات.");
      await signOutFirebase(firebaseClientAuth).catch(() => undefined);
      clearVerificationContext();
      clearPostProfileRedirect();
      sessionStorage.removeItem("fursa-phone-verification-id");
      sessionStorage.removeItem("fursa-registration-role");
      sessionStorage.removeItem("fursa-login-redirect");
      sessionStorage.removeItem("fursa-post-profile-redirect");
      window.location.replace(pathname.startsWith("/admin") ? "/admin-login" : "/login");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تحقق من اتصالك وحاول مرة أخرى.");
    } finally {
      setPending(false);
    }
  }

  return <span className={cn("relative inline-flex", showLabel && "w-full flex-col")}><button
    type="button"
    onClick={logout}
    disabled={pending}
    className={cn(
      "flex h-10 items-center justify-center gap-2 rounded-md text-body-sm font-medium text-neutral-600 transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50",
      showLabel ? "w-full px-3" : "w-10 rounded-full",
      className,
    )}
    aria-label="تسجيل الخروج"
    title="تسجيل الخروج"
  >
    <LogOut className="h-4.5 w-4.5 rtl-flip" />
    {showLabel && <span>{pending ? "جارٍ الخروج..." : "تسجيل الخروج"}</span>}
  </button>{errorMessage ? <span role="alert" className={cn("z-20 rounded-md border border-danger-500/25 bg-danger-50 px-2 py-1.5 text-start text-caption text-danger-500 shadow-md", showLabel ? "mt-1 w-full" : "absolute end-0 top-full mt-1 w-48")}>{errorMessage}</span> : null}</span>;
}
