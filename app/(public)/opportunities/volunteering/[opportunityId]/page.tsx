import { notFound } from "next/navigation";
import { MapPin, Briefcase, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationForm } from "@/features/applications/components/application-form";
import { OtherApplicantsList } from "@/features/opportunities/components/other-applicants-list";
import { getOpportunityById } from "@/features/opportunities/services/opportunities.service";
import { listOpportunityApplicantPreviews } from "@/features/applications/services/applications.service";
import { WORK_MODE_LABELS } from "@/lib/constants";
import { getRemainingTimeLabel } from "@/lib/utils";
import { requirePageSession } from "@/lib/auth/session";

/** بنية مطابقة لـ opportunities/jobs/[opportunityId]/page.tsx — راجع تعليقات ذلك الملف */
export default async function VolunteeringDetailsPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  await requirePageSession();
  const { opportunityId } = await params;
  const opportunity = await getOpportunityById(opportunityId);

  if (!opportunity || opportunity.type !== "volunteering") notFound();

  const applicants = await listOpportunityApplicantPreviews(opportunityId);
  const otherApplicantsPreview = applicants.map((a) => ({
    id: a.id,
    fullName: a.applicantProfile.fullName,
    avatarUrl: a.applicantProfile.avatarUrl,
  }));

  const requiresResume = opportunity.requiresResume === "true";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary-50 text-h4 font-semibold text-primary-700">
          {opportunity.organizationProfile?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={opportunity.organizationProfile.logoUrl}
              alt={opportunity.organizationProfile.name}
              className="h-full w-full object-cover"
            />
          ) : (
            opportunity.organizationProfile?.name?.charAt(0)
          )}
        </div>
        <div>
          <p className="text-body-sm font-medium text-neutral-600">{opportunity.organizationProfile?.name}</p>
          <Badge variant="info">تطوع</Badge>
        </div>
      </div>

      <h1 className="mt-4 text-h1 text-neutral-900">{opportunity.title}</h1>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-secondary">
        <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{opportunity.city}</span>
        <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{WORK_MODE_LABELS[opportunity.workMode]}</span>
        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{getRemainingTimeLabel(opportunity.applicationDeadline)}</span>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-h4 text-neutral-800">وصف الفرصة</h2>
        <p className="mt-2 whitespace-pre-line text-body text-neutral-700">{opportunity.description}</p>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-h4 text-neutral-800">التقديم على هذه الفرصة</h2>
        <div className="mt-4">
          <ApplicationForm
            opportunityId={opportunity.id}
            opportunityType="volunteering"
            requiresResume={requiresResume}
          />
        </div>
      </Card>

      <OtherApplicantsList applicants={otherApplicantsPreview} />
    </div>
  );
}
