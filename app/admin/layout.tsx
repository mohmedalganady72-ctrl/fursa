import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { isAdmin } from "@/features/auth/services/permissions";
import { DashboardSidebar, type SidebarNavItem } from "@/components/layout/dashboard-sidebar";
import { DashboardBottomNav } from "@/components/layout/dashboard-bottom-nav";
import { LogoutButton } from "@/components/shared/logout-button";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withDatabaseRetry } from "@/lib/db/retry";

const ADMIN_NAV_ITEMS: SidebarNavItem[] = [
  { href: "/admin/dashboard", label: "الرئيسية", icon: "dashboard" },
  { href: "/admin/organizations/requests", label: "طلبات الجهات", icon: "organization" },
  { href: "/admin/users/applicants", label: "الباحثون", icon: "users" },
  { href: "/admin/users/organizations", label: "الجهات", icon: "opportunities" },
  { href: "/admin/admins", label: "المديرون", icon: "admins" },
  { href: "/admin/notifications/broadcast", label: "إرسال إشعار", icon: "broadcast" },
  { href: "/admin/reports", label: "البلاغات", icon: "reports" },
];

export const dynamic = "force-dynamic";

/** حارس لوحة تحكم المدير — أعلى مستوى صلاحية في المشروع، بلا حالة "قيد المراجعة" (المدير معتمد دائمًا فور إنشائه) */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || !isAdmin(session)) {
    redirect("/admin-login");
  }
  const admin = await withDatabaseRetry(() => db.query.admins.findFirst({
    columns: { displayName: true },
    where: eq(admins.userId, session.user.id),
  }));

  return (
    <div className="dashboard-shell flex min-h-screen bg-background">
      <DashboardSidebar items={ADMIN_NAV_ITEMS} user={{ name: admin?.displayName ?? session.user.name ?? "مدير المنصة", image: session.user.image, roleLabel: "مدير المنصة" }} />
      <main className="flex-1 px-4 py-6 pb-20 md:px-6 md:pb-6 lg:px-8">
        <div className="mx-auto max-w-5xl"><div className="mb-4 flex justify-end md:hidden"><LogoutButton /></div>{children}</div>
      </main>
      <DashboardBottomNav items={ADMIN_NAV_ITEMS} />
    </div>
  );
}
