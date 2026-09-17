import { eq, count } from "drizzle-orm";
import { Briefcase, Users, CheckCircle2 } from "lucide-react";
import { DashboardStatCard } from "@/components/charts/dashboard-stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { organizationProfiles, applications, opportunities } from "@/lib/db/schema";
import { listOrganizationOpportunities } from "@/features/opportunities/services/opportunities.service";
import { OrganizationAnalytics } from "@/components/charts/organization-analytics";

/** الصفحة الرئيسية للوحة الجهة — إحصائيات الطلبات والمتقدمين والمقبولين (راجع حالات الاستخدام § 5) */
export default async function OrganizationDashboardPage() {
  const session = await getServerSession();
  const profile = await db.query.organizationProfiles.findFirst({
    where: eq(organizationProfiles.userId, session!.user.id),
  });

  if (!profile) {
    return <EmptyState icon={Briefcase} title="أكمل ملف جهتك أولًا" actionLabel="إكمال الملف" />;
  }

  const orgOpportunities = await listOrganizationOpportunities(profile.id);
  const opportunityIds = orgOpportunities.map((o) => o.id);

  const allApplications =
    opportunityIds.length > 0
      ? await db.query.applications.findMany({
          where: (a, { inArray }) => inArray(a.opportunityId, opportunityIds),
        })
      : [];

  const stats = {
    totalOpportunities: orgOpportunities.length,
    openOpportunities: orgOpportunities.filter((o) => o.status === "published").length,
    totalApplicants: allApplications.length,
    accepted: allApplications.filter((a) => a.status === "accepted").length,
  };
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 29);
  startDate.setHours(0, 0, 0, 0);
  const dailyCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();
  const opportunityCounts = new Map<string, number>();
  for (const application of allApplications) {
    const date = application.submittedAt.toISOString().slice(0, 10);
    dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
    statusCounts.set(application.status, (statusCounts.get(application.status) ?? 0) + 1);
    opportunityCounts.set(application.opportunityId, (opportunityCounts.get(application.opportunityId) ?? 0) + 1);
  }
  const trend = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { date: key, value: dailyCounts.get(key) ?? 0 };
  });
  const statusData = Array.from(statusCounts, ([name, value]) => ({ name, value }));
  const opportunityData = orgOpportunities.slice(0, 8).map((opportunity) => ({
    name: opportunity.title.length > 18 ? `${opportunity.title.slice(0, 18)}…` : opportunity.title,
    value: opportunityCounts.get(opportunity.id) ?? 0,
  }));

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">مرحبًا، {profile.name}</h1>
      <p className="mt-1 text-body text-secondary">نظرة سريعة على فرصكم ومتقدميكم</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardStatCard icon={Briefcase} label="إجمالي الفرص" value={stats.totalOpportunities} />
        <DashboardStatCard icon={Briefcase} label="فرص مفتوحة" value={stats.openOpportunities} />
        <DashboardStatCard icon={Users} label="إجمالي المتقدمين" value={stats.totalApplicants} />
        <DashboardStatCard icon={CheckCircle2} label="المقبولون" value={stats.accepted} />
      </div>
      <OrganizationAnalytics trend={trend} statuses={statusData} opportunities={opportunityData} />
    </div>
  );
}
