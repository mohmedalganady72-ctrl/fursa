import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { isApplicant } from "@/features/auth/services/permissions";
import { DashboardSidebar, type SidebarNavItem } from "@/components/layout/dashboard-sidebar";
import { DashboardBottomNav } from "@/components/layout/dashboard-bottom-nav";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getUnreadMessageCount } from "@/features/messaging/services/messages.service";
import { getUnreadNotificationCount } from "@/features/notifications/services/notifications.service";
import { ProfileCompletionGate } from "@/components/layout/profile-completion-gate";
import { db } from "@/lib/db";
import { applicantProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withDatabaseRetry } from "@/lib/db/retry";
import { getPostAuthPath } from "@/lib/auth/destination";

/**
 * التنقل السفلي على الهاتف (DashboardBottomNav) يعرض فقط أول 5 عناصر (items.slice(0, 5)
 * — راجع phase 10). القائمة الأساسية أدناه بالضبط 5 عناصر وتُستخدم للسفلي وأساسًا للجانبي،
 * وعنصر "الفٌرص المحفوظة" يُضاف فوقها فقط للشريط الجانبي عبر SIDEBAR_NAV_ITEMS كي لا
 * يكسر التنقل السفلي بظهور عنصر سادس يُقتطَع بصمت أو يُزيح عنصرًا آخر.
 */
const APPLICANT_NAV_ITEMS: SidebarNavItem[] = [
  { href: "/applicant/dashboard", label: "الرئيسية", icon: "dashboard" },
  { href: "/applicant/profile", label: "ملفي الشخصي", icon: "profile" },
  { href: "/applicant/applications", label: "طلباتي", icon: "applications" },
  { href: "/applicant/opportunities", label: "البحث عن فٌرص", icon: "opportunities" },
  { href: "/applicant/messages", label: "الرسائل", icon: "messages" },
];

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  ...APPLICANT_NAV_ITEMS,
  { href: "/applicant/smart-search", label: "البحث الذكي", icon: "smart-search" },
  { href: "/applicant/saved-opportunities", label: "الفٌرص المحفوظة", icon: "saved" },
];

export const dynamic = "force-dynamic";

/** حارس لوحة الباحث + الهيكل البصري المشترك لكل صفحاتها (شريط جانبي/سفلي) */
export default async function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }
  if (session.user.isRestricted) redirect("/account-restricted");
  if (!isApplicant(session)) redirect(await getPostAuthPath(session));

  const profile = await withDatabaseRetry(() =>
    db.query.applicantProfiles.findFirst({ columns: { id: true, fullName: true, avatarUrl: true }, where: eq(applicantProfiles.userId, session.user.id) }),
  );

  if (!profile) {
    return <ProfileCompletionGate complete={false} profilePath="/applicant/profile">{children}</ProfileCompletionGate>;
  }

  const notificationCount = await withDatabaseRetry(() => getUnreadNotificationCount(session.user.id));
  const messageCount = await withDatabaseRetry(() => getUnreadMessageCount(session.user.id));
  const applicantItems = APPLICANT_NAV_ITEMS.map((item) => item.icon === "messages" ? { ...item, badge: messageCount } : item);
  const sidebarItems = SIDEBAR_NAV_ITEMS.map((item) => item.icon === "messages" ? { ...item, badge: messageCount } : item);

  return <ProfileCompletionGate complete profilePath="/applicant/profile">
    <div className="dashboard-shell flex min-h-screen bg-background">
      <DashboardSidebar items={sidebarItems} user={{ name: profile?.fullName ?? session.user.name ?? "باحث عن فٌرصة", email: session.user.email, image: profile?.avatarUrl ?? session.user.image, roleLabel: "باحث عن فٌرصة" }} />
      <main className="flex-1 px-4 py-6 pb-20 md:px-6 md:pb-6 lg:px-8">
        <div className="mx-auto max-w-4xl"><DashboardHeader basePath="/applicant" initialNotifications={notificationCount} initialMessages={messageCount} />{children}</div>
      </main>
      <DashboardBottomNav items={applicantItems} />
    </div>
  </ProfileCompletionGate>;
}
