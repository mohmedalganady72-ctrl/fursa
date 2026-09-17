import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { OpportunityCard } from "@/components/shared/opportunity-card";
import { EmptyState } from "@/components/shared/empty-state";
import { OpportunityFilters } from "@/features/opportunities/components/opportunity-filters";
import { listOpportunities } from "@/features/opportunities/services/opportunities.service";
import { getSavedOpportunityIds } from "@/features/opportunities/services/saved-opportunities.service";
import { getApplicantProfileByUserId } from "@/features/applicant-profile/services/applicant-profile.service";
import { opportunityFiltersSchema } from "@/features/opportunities/validators/opportunity-filters.schema";
import { getServerSession } from "@/lib/auth/session";
import { isApplicant } from "@/features/auth/services/permissions";
import { OPPORTUNITY_TYPES } from "@/lib/constants";

export const metadata: Metadata = { title: "التدريب التعاوني" };

/** بنية مطابقة تمامًا لـ app/(public)/opportunities/jobs/page.tsx — راجع تعليق ذلك الملف */
export default async function CoOpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters = opportunityFiltersSchema.parse({ ...params, type: OPPORTUNITY_TYPES.CO_OP });

  const results = await listOpportunities(filters);

  // حالة الحفظ تُجلب فقط للباحث المسجَّل — الزائر وغير الباحث لا يريان زر الحفظ إطلاقًا
  let savedIds: Set<string> | null = null;
  const session = await getServerSession();
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
      <h1 className="text-h1 text-neutral-900">التدريب التعاوني</h1>
      <p className="mt-2 text-body text-secondary">فرص تدريب تعاوني تطابق تخصصك الجامعي ومستواك الدراسي</p>

      <div className="mt-6">
        <OpportunityFilters />
      </div>

      <div className="mt-6">
        {results.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="لا توجد فرص تدريب تعاوني تطابق بحثك حاليًا"
            description="جرّب تعديل الفلاتر أو البحث بكلمات مختلفة"
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
