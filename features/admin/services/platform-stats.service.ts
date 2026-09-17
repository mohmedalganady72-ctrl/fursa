import { count, eq, gte, sql } from "drizzle-orm";
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

/**
 * الإحصائيات العامة المعروضة في app/(admin)/dashboard/page.tsx.
 * كل رقم يُحسَب عبر count() مباشرة في قاعدة البيانات بدل سحب الصفوف كاملة للعدّ في التطبيق
 * — فرق أداء كبير مع نمو حجم البيانات.
 */
export async function getPlatformOverviewStats() {
  const [
    totalApplicantsRows,
    organizationsRows,
    pendingJoinRequestsRows,
    opportunitiesRows,
    applicationsRows,
  ] = await Promise.all([
    retryQuery(async () => db.select({ value: count() }).from(users).where(eq(users.role, USER_ROLES.APPLICANT))),
    retryQuery(async () => db.select({
      total: count(),
      approved: sql<number>`count(*) filter (where ${organizationProfiles.isApproved} = true)`,
    }).from(organizationProfiles)),
    retryQuery(async () => db.select({ value: count() }).from(organizationJoinRequests).where(eq(organizationJoinRequests.status, "pending"))),
    retryQuery(async () => db.select({
      total: count(),
      open: sql<number>`count(*) filter (where ${opportunities.status} = 'published')`,
    }).from(opportunities)),
    retryQuery(async () => db.select({
      total: count(),
      accepted: sql<number>`count(*) filter (where ${applications.status} = 'accepted')`,
    }).from(applications)),
  ]);

  return {
    totalApplicants: totalApplicantsRows[0]?.value ?? 0,
    totalOrganizations: organizationsRows[0]?.total ?? 0,
    approvedOrganizations: Number(organizationsRows[0]?.approved ?? 0),
    pendingJoinRequests: pendingJoinRequestsRows[0]?.value ?? 0,
    totalOpportunities: opportunitiesRows[0]?.total ?? 0,
    openOpportunities: Number(opportunitiesRows[0]?.open ?? 0),
    totalApplications: applicationsRows[0]?.total ?? 0,
    acceptedApplications: Number(applicationsRows[0]?.accepted ?? 0),
  };
}

/**
 * اتجاه عدد التقديمات خلال آخر 30 يومًا — يُستخدم في الرسم البياني بلوحة المدير
 * (راجع components/charts/applications-trend-chart.tsx في مرحلة بناء الصفحات).
 */
export async function getApplicationsTrend(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await retryQuery(async () => db
    .select({ submittedAt: applications.submittedAt })
    .from(applications)
    .where(gte(applications.submittedAt, startDate)));

  // تجميع يدوي حسب اليوم — أبسط من استعلام SQL بتنسيق تاريخ خاص بـ dialect معيّن،
  // وحجم البيانات هنا (شهر واحد) صغير بما يكفي ليكون التجميع في التطبيق مقبول الأداء
  const countsByDate = new Map<string, number>();
  for (const row of rows) {
    const dateKey = row.submittedAt.toISOString().slice(0, 10);
    countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + 1);
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index + 1);
    const dateKey = date.toISOString().slice(0, 10);
    return { date: dateKey, value: countsByDate.get(dateKey) ?? 0 };
  });
}

export async function getPlatformChartBreakdowns() {
  const [opportunityTypes, applicationStatuses] = await Promise.all([
    retryQuery(async () => db.select({ name: opportunities.type, value: count() }).from(opportunities).groupBy(opportunities.type)),
    retryQuery(async () => db.select({ name: applications.status, value: count() }).from(applications).groupBy(applications.status)),
  ]);
  return { opportunityTypes, applicationStatuses };
}
