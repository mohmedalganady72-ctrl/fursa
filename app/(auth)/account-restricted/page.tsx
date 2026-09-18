import Link from "next/link";
import { redirect } from "next/navigation";
import { Headphones, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/shared/logout-button";
import { getServerSession } from "@/lib/auth/session";
import { getPostAuthPath } from "@/lib/auth/destination";

export const metadata = { title: "الحساب مقيّد" };

export default async function AccountRestrictedPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!session.user.isRestricted) redirect(await getPostAuthPath(session));

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-50 text-danger-500">
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-h2 text-neutral-900">حسابك مقيّد مؤقتًا</h1>
        <p className="mt-3 text-body leading-7 text-secondary">
          لا يمكنك استخدام المنصة حاليًا. راجع فريق الدعم لمعرفة المزيد ومتابعة حالة حسابك.
        </p>
        <p className="mt-2 text-body-sm text-neutral-500" dir="ltr">{session.user.email}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild><Link href="/contact"><Headphones className="h-4 w-4" />التواصل مع الدعم</Link></Button>
          <LogoutButton showLabel className="w-auto border border-neutral-300 px-4" />
        </div>
      </section>
    </main>
  );
}
