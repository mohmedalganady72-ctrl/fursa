import Link from "next/link";
import { eq } from "drizzle-orm";
import { Briefcase, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { requirePageSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { organizationProfiles } from "@/lib/db/schema";
import { listOrganizationOpportunities } from "@/features/opportunities/services/opportunities.service";
import { OPPORTUNITY_TYPE_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/constants";
import { formatDateArabic } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "success" | "neutral" | "info" | "warning"> = {
  draft: "neutral",
  published: "success",
  closed: "neutral",
  expired: "warning",
};

export default async function OrganizationOpportunitiesPage() {
  const session = await requirePageSession();
  const profile = await db.query.organizationProfiles.findFirst({
    where: eq(organizationProfiles.userId, session.user.id),
  });

  const opportunities = profile ? await listOrganizationOpportunities(profile.id) : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-neutral-900">فرصي</h1>
        <Button asChild>
          <Link href="/organization/opportunities/new">
            <Plus className="h-4 w-4" />
            فرصة جديدة
          </Link>
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Briefcase}
            title="لم تنشروا أي فرصة حتى الآن"
            description="ابدؤوا بنشر أول فرصة وظيفية أو تطوعية أو تدريب تعاوني."
            actionLabel="نشر فرصة جديدة"
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {opportunities.map((opp) => (
            <Card key={opp.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{OPPORTUNITY_TYPE_LABELS[opp.type]}</Badge>
                  <Badge variant={STATUS_VARIANTS[opp.status]}>{OPPORTUNITY_STATUS_LABELS[opp.status]}</Badge>
                </div>
                <h3 className="mt-2 text-h4 text-neutral-800">{opp.title}</h3>
                <p className="mt-1 text-caption text-neutral-400">
                  نُشرت في {formatDateArabic(opp.publishedAt)} · المقاعد المشغولة: {opp.seatsFilled} من {opp.seatsAvailable}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/organization/opportunities/${opp.id}/applicants`}>
                  <Users className="h-4 w-4" />
                  المتقدمون
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
