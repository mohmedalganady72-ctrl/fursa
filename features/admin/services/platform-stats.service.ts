import { count, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  organizationProfiles,
  opportunities,
  applications,
  organizationJoinRequests,
} from "@/lib/db/schema";
import { USER_ROLES } from "@/lib/constants";
import { withDatabaseRetry } from "@/lib/db/retry";

const retryQuery = <T>(query: () => Promise<T>) => withDatabaseRetry(query, 3);

interface PlatformOverviewRow {
  [key: string]: unknown;
  totalApplicants: number;
  totalOrganizations: number;
  approvedOrganizations: number;
  pendingJoinRequests: number;
  totalOpportunities: number;
  openOpportunities: number;
  totalApplications: number;
  acceptedApplications: number;
}

/**
 * الإحصائيات العامة المعروضة في app/(admin)/dashboard/page.tsx.
 * كل رقم يُحسَب عبر count() مباشرة في قاعدة البيانات بدل سحب الصفوف كاملة للعدّ في التطبيق
 * — فرق أداء كبير مع نمو حجم البيانات.
 */
export async function getPlatformOverviewStats() {
  const [summary] = await retryQuery(async () => db.execute<PlatformOverviewRow>(sql`
    select
      (select count(*)::int from ${users} where ${users.role} = ${USER_ROLES.APPLICANT}) as "totalApplicants",
      (select count(*)::int from ${organizationProfiles}) as "totalOrganizations",
      (select count(*)::int from ${organizationProfiles} where ${organizationProfiles.isApproved} = true) as "approvedOrganizations",
      (select count(*)::int from ${organizationJoinRequests} where ${organizationJoinRequests.status} = 'pending') as "pendingJoinRequests",
      (select count(*)::int from ${opportunities}) as "totalOpportunities",
      (select count(*)::int from ${opportunities} where ${opportunities.status} = 'published') as "openOpportunities",
      (select count(*)::int from ${applications}) as "totalApplications",
      (select count(*)::int from ${applications} where ${applications.status} = 'accepted') as "acceptedApplications"
  `));

  return {
    totalApplicants: Number(summary?.totalApplicants ?? 0),
    totalOrganizations: Number(summary?.totalOrganizations ?? 0),
    approvedOrganizations: Number(summary?.approvedOrganizations ?? 0),
    pendingJoinRequests: Number(summary?.pendingJoinRequests ?? 0),
    totalOpportunities: Number(summary?.totalOpportunities ?? 0),
    openOpportunities: Number(summary?.openOpportunities ?? 0),
    totalApplications: Number(summary?.totalApplications ?? 0),
    acceptedApplications: Number(summary?.acceptedApplications ?? 0),
  };
}

/**
 * اتجاه عدد التقديمات خلال آخر 30 يومًا — يُستخدم في الرسم البياني بلوحة المدير
 * (راجع components/charts/applications-trend-chart.tsx في مرحلة بناء الصفحات).
 */
export async function getApplicationsTrend(days = 30) {
  const today = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const startDate = new Date(`${today}T00:00:00+03:00`);
  startDate.setUTCDate(startDate.getUTCDate() - days + 1);

  const day = sql<string>`to_char(${applications.submittedAt} at time zone 'Asia/Riyadh', 'YYYY-MM-DD')`;
  const rows = await retryQuery(async () => db
    .select({ date: day, value: count() })
    .from(applications)
    .where(gte(applications.submittedAt, startDate)).groupBy(day));

  // تجميع يدوي حسب اليوم — أبسط من استعلام SQL بتنسيق تاريخ خاص بـ dialect معيّن،
  // وحجم البيانات هنا (شهر واحد) صغير بما يكفي ليكون التجميع في التطبيق مقبول الأداء
  const countsByDate = new Map<string, number>();
  for (const row of rows) {
    countsByDate.set(row.date, Number(row.value));
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
    date.setUTCDate(date.getUTCDate() + index);
    const dateKey = date.toISOString().slice(0, 10);
    return { date: dateKey, value: countsByDate.get(dateKey) ?? 0 };
  });
}

export async function getPlatformChartBreakdowns() {
  const opportunityTypes = await retryQuery(async () =>
    db.select({ name: opportunities.type, value: count() }).from(opportunities).groupBy(opportunities.type)
  );
  const applicationStatuses = await retryQuery(async () =>
    db.select({ name: applications.status, value: count() }).from(applications).groupBy(applications.status)
  );
  return { opportunityTypes, applicationStatuses };
}
