"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut as signOutFirebase } from "firebase/auth";
import { authClient } from "@/lib/auth/client";
import { firebaseClientAuth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

export function LogoutButton({ showLabel = false, className }: { showLabel?: boolean; className?: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      await Promise.allSettled([authClient.signOut(), signOutFirebase(firebaseClientAuth)]);
      router.replace("/login");
      router.refresh();
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
