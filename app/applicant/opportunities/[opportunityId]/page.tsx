import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Briefcase, CheckCircle2, Clock, GraduationCap, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApplicationForm } from "@/features/applications/components/application-form";
import { hasApplicantApplied, listOpportunityApplicantPreviews } from "@/features/applications/services/applications.service";
import { OtherApplicantsList } from "@/features/opportunities/components/other-applicants-list";
import { getOpportunityById } from "@/features/opportunities/services/opportunities.service";
import { OPPORTUNITY_TYPE_LABELS, WORK_MODE_LABELS } from "@/lib/constants";
import { getRemainingTimeLabel } from "@/lib/utils";
import { requirePageSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { applicantProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ShareOpportunityButton } from "@/features/opportunities/components/share-opportunity-button";

export default async function ApplicantOpportunityDetailsPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = await params;
  const opportunity = await getOpportunityById(opportunityId);

  if (!opportunity) notFound();

  const session = await requirePageSession();
  const profile = await db.query.applicantProfiles.findFirst({
    columns: { id: true },
    where: eq(applicantProfiles.userId, session.user.id),
  });
  const [applicants, alreadyApplied] = await Promise.all([
    listOpportunityApplicantPreviews(opportunityId),
    profile ? hasApplicantApplied(profile.id, opportunityId) : false,
  ]);
  const otherApplicantsPreview = applicants.map((applicant) => ({
    id: applicant.id,
    fullName: applicant.applicantProfile.fullName,
    avatarUrl: applicant.applicantProfile.avatarUrl,
  }));
  const qualification = opportunity.type === "co_op"
    ? opportunity.requiredAcademicLevel
    : opportunity.requiredQualification;
  const applicationHeading = opportunity.type === "job"
    ? "التقديم على هذه الوظيفة"
    : opportunity.type === "co_op"
      ? "التقديم على هذا التدريب"
      : "التقديم على هذه الفٌرصة";
  const requiresResume = opportunity.type === "job"
    || (opportunity.type === "volunteering" && opportunity.requiresResume === "true");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild><Link href="/applicant/opportunities"><ArrowRight className="h-4 w-4" />العودة إلى الفٌرص</Link></Button>
        <ShareOpportunityButton opportunityId={opportunity.id} title={opportunity.title} />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-50 text-h4 font-semibold text-primary-700">
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
          <Link href={`/applicant/organizations/${opportunity.organizationProfile.id}`} className="text-body-sm font-medium text-neutral-600 hover:text-primary-700 hover:underline">{opportunity.organizationProfile?.name}</Link>
          <Badge variant="info">{OPPORTUNITY_TYPE_LABELS[opportunity.type]}</Badge>
        </div>
      </div>

      <h1 className="mt-4 text-h1 text-neutral-900">{opportunity.title}</h1>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-secondary">
        <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{opportunity.city}</span>
        <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{WORK_MODE_LABELS[opportunity.workMode]}</span>
        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{getRemainingTimeLabel(opportunity.applicationDeadline)}</span>
        {qualification ? <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{qualification}</span> : null}
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-h4 text-neutral-800">وصف الفٌرصة</h2>
        <p className="mt-2 whitespace-pre-line text-body text-neutral-700">{opportunity.description}</p>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-h4 text-neutral-800">{applicationHeading}</h2>
        {alreadyApplied ? (
          <div className="mt-4 flex items-center gap-3 rounded-md border border-success-500/20 bg-success-50 p-4 text-success-500">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-body-sm font-medium">سبق أن قدمت على هذه الفٌرصة، ولا يمكن التقديم عليها مرة أخرى.</p>
          </div>
        ) : (
          <div className="mt-4">
            <ApplicationForm
              opportunityId={opportunity.id}
              opportunityType={opportunity.type}
              requiresResume={requiresResume}
            />
          </div>
        )}
      </Card>

      <OtherApplicantsList applicants={otherApplicantsPreview} />
    </div>
  );
}
