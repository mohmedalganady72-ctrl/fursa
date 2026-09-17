"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut as signOutFirebase } from "firebase/auth";
import { authClient } from "@/lib/auth/client";
import { firebaseClientAuth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";
import { clearPostProfileRedirect, clearVerificationContext } from "@/lib/firebase/auth-flow";
import { useToast } from "@/hooks/use-toast";

export function LogoutButton({ showLabel = false, className }: { showLabel?: boolean; className?: string }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message ?? "تعذّر إنهاء الجلسة.");
      await signOutFirebase(firebaseClientAuth).catch(() => undefined);
      clearVerificationContext();
      clearPostProfileRedirect();
      sessionStorage.removeItem("fursa-phone-verification-id");
      sessionStorage.removeItem("fursa-registration-role");
      sessionStorage.removeItem("fursa-login-redirect");
      sessionStorage.removeItem("fursa-post-profile-redirect");
      window.location.replace(pathname.startsWith("/admin") ? "/admin-login" : "/login");
    } catch (error) {
      toast({
        variant: "error",
        title: "تعذّر تسجيل الخروج",
        description: error instanceof Error ? error.message : "تحقق من اتصالك وحاول مرة أخرى.",
      });
    } finally {
      setPending(false);
    }
  }

  return <button
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
  </button>;
}
