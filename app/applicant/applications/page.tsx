import { eq } from "drizzle-orm";
import Link from "next/link";
import { FileText } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { requirePageSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { applicantProfiles } from "@/lib/db/schema";
import { listApplicantApplications } from "@/features/applications/services/applications.service";
import { OPPORTUNITY_TYPE_LABELS } from "@/lib/constants";
import { formatDateArabic } from "@/lib/utils";

/** لوحة "تقديماتي" — كل تقديمات الباحث مع حالتها الحالية (راجع حالات الاستخدام § "عرض حالات تقديماته") */
export default async function ApplicantApplicationsPage() {
  const session = await requirePageSession();
  const profile = await db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.userId, session.user.id),
  });

  if (!profile) {
    return <EmptyState icon={FileText} title="أكمل ملفك الشخصي أولًا" />;
  }

  const applications = await listApplicantApplications(profile.id);

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">طلباتي</h1>
      <p className="mt-1 text-body text-secondary">تابع حالة طلباتك والفرص التي تقدّمت إليها.</p>

      {applications.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={FileText}
            title="لم تتقدّم إلى أي فرصة حتى الآن"
            actionLabel="تصفّح الفرص"
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {applications.map((app) => (
            <Link key={app.id} href={`/applicant/opportunities/${app.opportunity.id}`} className="block rounded-lg focus-visible:outline-none">
            <Card className="flex items-center justify-between gap-4 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/40">
              <div>
                <p className="text-body-sm text-secondary">
                  {OPPORTUNITY_TYPE_LABELS[app.opportunity.type]} · {app.opportunity.organizationProfile?.name}
                </p>
                <h3 className="mt-0.5 text-h4 text-neutral-800">{app.opportunity.title}</h3>
                <p className="mt-1 text-caption text-neutral-400">
                  قُدِّم في {formatDateArabic(app.submittedAt)}
                </p>
              </div>
              <StatusBadge status={app.status} />
            </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
