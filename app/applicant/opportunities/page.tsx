import { Briefcase } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OpportunityCard } from "@/components/shared/opportunity-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ApplicantOpportunitySearch } from "@/features/opportunities/components/applicant-opportunity-search";
import { listOpportunities } from "@/features/opportunities/services/opportunities.service";
import { getSavedOpportunityIds } from "@/features/opportunities/services/saved-opportunities.service";
import { opportunityFiltersSchema } from "@/features/opportunities/validators/opportunity-filters.schema";
import { requirePageSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { applicantProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function ApplicantOpportunitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const parsed = opportunityFiltersSchema.safeParse({ ...params, pageSize: 50 });
  const filters = parsed.success ? parsed.data : opportunityFiltersSchema.parse({ pageSize: 50 });
  const session = await requirePageSession();
  const [rows, profileRows] = await Promise.all([
    listOpportunities(filters, true),
    db.select({ id: applicantProfiles.id }).from(applicantProfiles)
      .where(eq(applicantProfiles.userId, session.user.id)).limit(1),
  ]);
  const hasNextPage = rows.length > filters.pageSize;
  const results = rows.slice(0, filters.pageSize);
  function pageUrl(page: number) {
    const query = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
    query.set("page", String(page));
    return `/applicant/opportunities?${query}`;
  }
  const profile = profileRows[0];
  const savedIds = profile ? await getSavedOpportunityIds(profile.id, results.map((row) => row.opportunities.id)) : new Set<string>();

  return <div>
    <div><h1 className="text-h1 text-neutral-900">البحث عن فٌرص</h1><p className="mt-1 text-body text-secondary">تظهر جميع الفٌرص أدناه. حدّد خيارات التصفية، ثم اضغط «بحث» لعرض النتائج.</p></div>
    <ApplicantOpportunitySearch />
    <div className="mt-6">
      {results.length === 0 ? <EmptyState icon={Briefcase} title="لا توجد نتائج مطابقة" description="جرّب تغيير كلمات البحث أو إزالة بعض خيارات التصفية." /> : <><p className="mb-4 text-body-sm text-secondary">عدد النتائج: {results.length}</p><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{results.map((row) => <OpportunityCard key={row.opportunities.id} id={row.opportunities.id} type={row.opportunities.type} title={row.opportunities.title} organizationName={row.organization_profiles?.name ?? ""} organizationLogoUrl={row.organization_profiles?.logoUrl} city={row.opportunities.city} workMode={row.opportunities.workMode} applicationDeadline={row.opportunities.applicationDeadline} isSaved={savedIds.has(row.opportunities.id)} href={`/applicant/opportunities/${row.opportunities.id}`} />)}</div></>}
    </div>
    <nav aria-label="صفحات نتائج البحث" className="mt-6 flex items-center justify-between gap-3">
      {filters.page > 1 ? <Button asChild variant="outline"><Link href={pageUrl(filters.page - 1)}>السابق</Link></Button> : <span />}
      <span className="text-body-sm text-secondary">الصفحة {filters.page}</span>
      {hasNextPage ? <Button asChild variant="outline"><Link href={pageUrl(filters.page + 1)}>التالي</Link></Button> : <span />}
    </nav>
  </div>;
}
