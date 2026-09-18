import { eq } from "drizzle-orm";
import { Bookmark } from "lucide-react";
import { OpportunityCard } from "@/components/shared/opportunity-card";
import { EmptyState } from "@/components/shared/empty-state";
import { requirePageSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { applicantProfiles } from "@/lib/db/schema";
import { listSavedOpportunities } from "@/features/opportunities/services/saved-opportunities.service";

/** لوحة "الفٌرص المحفوظة" — كل الفٌرص التي حفظها الباحث لمراجعتها لاحقًا (راجع § 5.20) */
export default async function SavedOpportunitiesPage() {
  const session = await requirePageSession();
  const profile = await db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.userId, session.user.id),
  });

  if (!profile) {
    return <EmptyState icon={Bookmark} title="أكمل ملفك الشخصي أولًا" />;
  }

  const saved = await listSavedOpportunities(profile.id);

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">الفٌرص المحفوظة</h1>
      <p className="mt-1 text-body text-secondary">الفٌرص التي حفظتها لمراجعتها لاحقًا</p>

      {saved.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Bookmark}
            title="لا توجد فٌرص محفوظة بعد"
            description="اضغط أيقونة الحفظ في بطاقة أي فٌرصة لإضافتها هنا."
            actionLabel="تصفّح الفٌرص"
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {saved.map((row) => (
            <OpportunityCard
              key={row.id}
              id={row.opportunity.id}
              type={row.opportunity.type}
              title={row.opportunity.title}
              organizationName={row.opportunity.organizationProfile?.name ?? ""}
              organizationLogoUrl={row.opportunity.organizationProfile?.logoUrl}
              city={row.opportunity.city}
              workMode={row.opportunity.workMode}
              applicationDeadline={row.opportunity.applicationDeadline}
              isSaved={true}
              href={`/applicant/opportunities/${row.opportunity.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
