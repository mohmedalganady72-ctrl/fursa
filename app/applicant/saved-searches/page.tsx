import { eq } from "drizzle-orm";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteSavedSearchButton } from "@/features/opportunities/components/delete-saved-search-button";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { applicantProfiles } from "@/lib/db/schema";
import { listSavedSearches } from "@/features/opportunities/services/saved-searches.service";
import { OPPORTUNITY_TYPE_LABELS, type OpportunityType } from "@/lib/constants";

const TYPE_ROUTE_SEGMENT: Record<OpportunityType, string> = {
  job: "jobs",
  volunteering: "volunteering",
  co_op: "co-op",
};

/** يبني رابط صفحة تصفح الفرص مع تطبيق فلاتر البحث المحفوظ كـ query params */
function buildSearchUrl(filters: Record<string, unknown>): string {
  const type = (filters.type as OpportunityType) ?? "job";
  const segment = TYPE_ROUTE_SEGMENT[type] ?? "jobs";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (key === "type" || value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const query = params.toString();
  return `/opportunities/${segment}${query ? `?${query}` : ""}`;
}

/** لوحة "عمليات البحث المحفوظة" — تُتيح للباحث استعادة فلاتر بحث سبق أن حفظها (P2) */
export default async function SavedSearchesPage() {
  const session = await getServerSession();
  const profile = await db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.userId, session!.user.id),
  });

  if (!profile) {
    return <EmptyState icon={Search} title="أكمل ملفك الشخصي أولًا" />;
  }

  const searches = await listSavedSearches(profile.id);

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">عمليات البحث المحفوظة</h1>
      <p className="mt-1 text-body text-secondary">استخدم خيارات بحث حفظتها سابقًا للعثور على الفرص بسرعة.</p>

      {searches.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Search}
            title="لا توجد عمليات بحث محفوظة بعد"
            description="احفظ خيارات البحث من صفحة الفرص لتستخدمها لاحقًا."
            actionLabel="تصفّح الفرص"
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {searches.map((s) => {
            const filters = s.filters as Record<string, unknown>;
            const type = (filters.type as OpportunityType) ?? "job";
            return (
              <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
                <a href={buildSearchUrl(filters)} className="flex-1">
                  <p className="text-body-sm font-medium text-neutral-800">{s.label}</p>
                  <p className="mt-1 text-caption text-secondary">
                    {OPPORTUNITY_TYPE_LABELS[type]}
                    {s.queryText ? ` · "${s.queryText}"` : ""}
                  </p>
                </a>
                <DeleteSavedSearchButton savedSearchId={s.id} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
