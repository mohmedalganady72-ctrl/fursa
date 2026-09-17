import { Briefcase } from "lucide-react";
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
  const filters = opportunityFiltersSchema.parse({ ...params, pageSize: 50 });
  const session = await requirePageSession();
  const [results, profileRows] = await Promise.all([
    listOpportunities(filters),
    db.select({ id: applicantProfiles.id }).from(applicantProfiles)
      .where(eq(applicantProfiles.userId, session.user.id)).limit(1),
  ]);
  const profile = profileRows[0];
  const savedIds = profile ? await getSavedOpportunityIds(profile.id, results.map((row) => row.opportunities.id)) : new Set<string>();

  return <div>
    <div><h1 className="text-h1 text-neutral-900">البحث عن فٌرص</h1><p className="mt-1 text-body text-secondary">تظهر جميع الفٌرص أدناه. حدّد خيارات التصفية، ثم اضغط «بحث» لعرض النتائج.</p></div>
    <ApplicantOpportunitySearch />
    <div className="mt-6">
      {results.length === 0 ? <EmptyState icon={Briefcase} title="لا توجد نتائج مطابقة" description="جرّب تغيير كلمات البحث أو إزالة بعض خيارات التصفية." /> : <><p className="mb-4 text-body-sm text-secondary">عدد النتائج: {results.length}</p><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{results.map((row) => <OpportunityCard key={row.opportunities.id} id={row.opportunities.id} type={row.opportunities.type} title={row.opportunities.title} organizationName={row.organization_profiles?.name ?? ""} organizationLogoUrl={row.organization_profiles?.logoUrl} city={row.opportunities.city} workMode={row.opportunities.workMode} applicationDeadline={row.opportunities.applicationDeadline} isSaved={savedIds.has(row.opportunities.id)} href={`/applicant/opportunities/${row.opportunities.id}`} />)}</div></>}
    </div>
  </div>;
}
