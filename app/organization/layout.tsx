import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Clock } from "lucide-react";
import { getServerSession } from "@/lib/auth/session";
import { isOrganization } from "@/features/auth/services/permissions";
import { DashboardSidebar, type SidebarNavItem } from "@/components/layout/dashboard-sidebar";
import { DashboardBottomNav } from "@/components/layout/dashboard-bottom-nav";
import { db } from "@/lib/db";
import { organizationProfiles } from "@/lib/db/schema";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getUnreadMessageCount } from "@/features/messaging/services/messages.service";
import { getUnreadNotificationCount } from "@/features/notifications/services/notifications.service";
import { ProfileCompletionGate } from "@/components/layout/profile-completion-gate";
import { LogoutButton } from "@/components/shared/logout-button";
import { withDatabaseRetry } from "@/lib/db/retry";
import { getPostAuthPath } from "@/lib/auth/destination";

const ORGANIZATION_NAV_ITEMS: SidebarNavItem[] = [
  { href: "/organization/dashboard", label: "الرئيسية", icon: "dashboard" },
  { href: "/organization/profile", label: "ملف الجهة", icon: "organization" },
  { href: "/organization/opportunities", label: "فرصي", icon: "opportunities" },
  { href: "/organization/messages", label: "الرسائل", icon: "messages" },
];

export const dynamic = "force-dynamic";

/**
 * حارس لوحة الجهة — يسمح بالدخول لأي حساب بدور organization بغضّ النظر عن حالة الاعتماد
 * (راجع تعليق هذا القرار في النسخة الأولى من هذا الملف، المرحلة 4)، لكن يعرض الآن فعليًا
 * شاشة "قيد المراجعة" بدل المحتوى الكامل حتى يُعتمَد الحساب من المدير.
 */
export default async function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }
  if (!isOrganization(session)) redirect(await getPostAuthPath(session));

  const profile = await withDatabaseRetry(() => db.query.organizationProfiles.findFirst({
    where: eq(organizationProfiles.userId, session.user.id),
  }));

  if (!profile) {
    return <ProfileCompletionGate complete={false} profilePath="/organization/profile">{children}</ProfileCompletionGate>;
  }

  if (profile && !profile.isApproved) {
    return (
      <ProfileCompletionGate complete profilePath="/organization/profile"><div className="relative flex min-h-screen items-center justify-center bg-background px-4">
        <LogoutButton className="absolute end-5 top-5" />
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-50">
            <Clock className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="mt-4 text-h3 text-neutral-800">حسابك قيد المراجعة</h1>
          <p className="mt-2 text-body-sm text-secondary">
            يراجع فريق المنصة بيانات جهتكم حاليًا. سيصلكم إشعار عند اعتماد الحساب،
            وبعدها يمكنكم نشر الفرص واستقبال طلبات المتقدمين.
          </p>
        </div>
      </div></ProfileCompletionGate>
    );
  }

  const [notificationCount, messageCount] = await Promise.all([
    getUnreadNotificationCount(session.user.id),
    getUnreadMessageCount(session.user.id),
  ]);
  const navItems = ORGANIZATION_NAV_ITEMS.map((item) => item.icon === "messages" ? { ...item, badge: messageCount } : item);

  return <ProfileCompletionGate complete profilePath="/organization/profile">
    <div className="dashboard-shell flex min-h-screen bg-background">
      <DashboardSidebar items={navItems} user={{ name: profile?.name ?? session.user.name ?? "جهة", image: profile?.logoUrl ?? session.user.image, roleLabel: "حساب جهة" }} />
      <main className="flex-1 px-4 py-6 pb-20 md:px-6 md:pb-6 lg:px-8">
        <div className="mx-auto max-w-5xl"><DashboardHeader basePath="/organization" initialNotifications={notificationCount} initialMessages={messageCount} />{children}</div>
      </main>
      <DashboardBottomNav items={navItems} />
    </div>
  </ProfileCompletionGate>;
}
