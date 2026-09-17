import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { OpportunityCard } from "@/components/shared/opportunity-card";
import { EmptyState } from "@/components/shared/empty-state";
import { OpportunityFilters } from "@/features/opportunities/components/opportunity-filters";
import { listOpportunities } from "@/features/opportunities/services/opportunities.service";
import { getSavedOpportunityIds } from "@/features/opportunities/services/saved-opportunities.service";
import { getApplicantProfileByUserId } from "@/features/applicant-profile/services/applicant-profile.service";
import { opportunityFiltersSchema } from "@/features/opportunities/validators/opportunity-filters.schema";
import { requirePageSession } from "@/lib/auth/session";
import { isApplicant } from "@/features/auth/services/permissions";
import { OPPORTUNITY_TYPES } from "@/lib/constants";

export const metadata: Metadata = { title: "فرص العمل" };

/**
 * صفحة تصفح فرص العمل — نفس البنية تُستنسَخ حرفيًا لصفحتي التطوع والتدريب التعاوني
 * (opportunities/volunteering, opportunities/co-op) بتغيير قيمة "type" فقط.
 * دُمج المنطق المشترك في opportunities.service.ts بدل تكراره في الصفحات الثلاث.
 */
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters = opportunityFiltersSchema.parse({ ...params, type: OPPORTUNITY_TYPES.JOB });

  const results = await listOpportunities(filters);

  // حالة الحفظ تُجلب فقط للباحث المسجَّل — الزائر وغير الباحث لا يريان زر الحفظ إطلاقًا
  let savedIds: Set<string> | null = null;
  const session = await requirePageSession();
  if (session && isApplicant(session)) {
    const profile = await getApplicantProfileByUserId(session.user.id);
    if (profile) {
      savedIds = await getSavedOpportunityIds(
        profile.id,
        results.map((row) => row.opportunities.id)
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
      <h1 className="text-h1 text-neutral-900">فرص العمل</h1>
      <p className="mt-2 text-body text-secondary">تصفّح أحدث الوظائف المتاحة وقدّم على ما يناسبك</p>

      <div className="mt-6">
        <OpportunityFilters />
      </div>

      <div className="mt-6">
        {results.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="لا توجد فرص تطابق بحثك حاليًا"
            description="جرّب تعديل خيارات التصفية أو استخدام كلمات بحث مختلفة."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((row) => (
              <OpportunityCard
                key={row.opportunities.id}
                id={row.opportunities.id}
                type={row.opportunities.type}
                title={row.opportunities.title}
                organizationName={row.organization_profiles?.name ?? ""}
                organizationLogoUrl={row.organization_profiles?.logoUrl}
                city={row.opportunities.city}
                workMode={row.opportunities.workMode}
                applicationDeadline={row.opportunities.applicationDeadline}
                isSaved={savedIds ? savedIds.has(row.opportunities.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
