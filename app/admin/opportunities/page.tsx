import { desc } from "drizzle-orm";
import { Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { OPPORTUNITY_TYPE_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/constants";
import { formatDateArabic } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "success" | "neutral" | "info" | "warning"> = {
  draft: "neutral",
  published: "success",
  closed: "neutral",
  expired: "warning",
};

/** مراجعة عامة على كل الفرص المنشورة عبر المنصة (راجع حالات الاستخدام § "مراجعة الفرص") */
export default async function AdminOpportunitiesPage() {
  const allOpportunities = await db.query.opportunities.findMany({
    with: { organizationProfile: true },
    orderBy: desc(opportunities.createdAt),
    limit: 100,
  });

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">الفرص</h1>
      <p className="mt-1 text-body text-secondary">آخر 100 فرصة منشورة عبر المنصة</p>

      {allOpportunities.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Briefcase} title="لا توجد فرص منشورة بعد" />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {allOpportunities.map((opp) => (
            <Card key={opp.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{OPPORTUNITY_TYPE_LABELS[opp.type]}</Badge>
                  <Badge variant={STATUS_VARIANTS[opp.status]}>{OPPORTUNITY_STATUS_LABELS[opp.status]}</Badge>
                </div>
                <h3 className="mt-2 text-h4 text-neutral-800">{opp.title}</h3>
                <p className="mt-1 text-caption text-neutral-400">
                  {opp.organizationProfile?.name} · نُشرت في {formatDateArabic(opp.publishedAt)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
