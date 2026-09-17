import { Users, Building2, Briefcase, CheckCircle2, Clock, FileText } from "lucide-react";
import { DashboardStatCard } from "@/components/charts/dashboard-stat-card";
import { AdminAnalytics } from "@/components/charts/admin-analytics";
import { getPlatformOverviewStats, getApplicationsTrend, getPlatformChartBreakdowns } from "@/features/admin/services/platform-stats.service";

/** الصفحة الرئيسية للوحة المدير — صورة شاملة عن صحة المنصة (راجع حالات الاستخدام § 10) */
export default async function AdminDashboardPage() {
  const [stats, trend, breakdowns] = await Promise.all([getPlatformOverviewStats(), getApplicationsTrend(), getPlatformChartBreakdowns()]);

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">لوحة التحكم</h1>
      <p className="mt-1 text-body text-secondary">نظرة شاملة على أداء المنصة</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardStatCard icon={Users} label="الباحثون عن فرص" value={stats.totalApplicants} />
        <DashboardStatCard icon={Building2} label="الجهات المعتمدة" value={`${stats.approvedOrganizations}/${stats.totalOrganizations}`} />
        <DashboardStatCard icon={Clock} label="طلبات انضمام معلَّقة" value={stats.pendingJoinRequests} />
        <DashboardStatCard icon={Briefcase} label="فرص مفتوحة" value={`${stats.openOpportunities}/${stats.totalOpportunities}`} />
        <DashboardStatCard icon={FileText} label="إجمالي الطلبات" value={stats.totalApplications} />
        <DashboardStatCard icon={CheckCircle2} label="طلبات مقبولة" value={stats.acceptedApplications} />
      </div>

      <AdminAnalytics trend={trend} opportunityTypes={breakdowns.opportunityTypes} applicationStatuses={breakdowns.applicationStatuses} approved={stats.approvedOrganizations} totalOrganizations={stats.totalOrganizations} />
    </div>
  );
}
