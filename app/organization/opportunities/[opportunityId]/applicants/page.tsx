import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, FileText, UserRound } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CompatibilityBadge } from "@/components/shared/compatibility-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ApplicantRowActions } from "@/features/applications/components/applicant-row-actions";
import { getOpportunityById } from "@/features/opportunities/services/opportunities.service";
import { listOpportunityApplicants } from "@/features/applications/services/applications.service";
import { requirePageSession } from "@/lib/auth/session";
import { getSignedUrl, STORAGE_BUCKETS } from "@/lib/supabase/storage";
import { StartConversationButton } from "@/features/messaging/components/start-conversation-button";

/**
 * قائمة المتقدمين على فرصة — الأعمدة تتغيّر حسب نوع الفرصة (راجع وثيقة المتطلبات
 * § "واجهات عرض المتقدمين"). مرتّبة تلقائيًا حسب درجة التوافق تنازليًا
 * (يحدث هذا فعليًا في listOpportunityApplicants عبر ORDER BY compatibilityScore DESC).
 * الترتيب/الترشيح الذكي هنا إرشادي بحت — يُذكَّر المستخدم بذلك بنص واضح أعلى الجدول.
 */
export default async function OpportunityApplicantsPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = await params;
  const opportunity = await getOpportunityById(opportunityId);
  const session = await requirePageSession();
  if (!opportunity || opportunity.organizationProfile.userId !== session.user.id) notFound();

  const applicants = await listOpportunityApplicants(opportunityId, session.user.id);
  const resumeLinks = new Map(await Promise.all(applicants.filter((app) => app.resumeUrl).map(async (app) => [
    app.id,
    await getSignedUrl({ bucket: STORAGE_BUCKETS.RESUMES, path: app.resumeUrl! }),
  ] as const)));
  const canAcceptMore = opportunity.seatsFilled < opportunity.seatsAvailable;

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">المتقدمون على: {opportunity.title}</h1>
      <p className="mt-1 text-body-sm text-secondary">
        تم شغل {opportunity.seatsFilled} من أصل {opportunity.seatsAvailable} مقعدًا ·{" "}
        <span className="text-neutral-400">
          الترتيب حسب درجة التوافق إرشادي، والقرار النهائي لجهتكم.
        </span>
      </p>

      {applicants.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Users} title="لا يوجد متقدمون على هذه الفرصة حتى الآن" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-surface shadow-sm">
          <table className="w-full text-start text-body-sm">
            <thead className="bg-neutral-100 text-caption font-semibold text-neutral-700">
              <tr>
                <th className="px-4 py-3 text-start">المتقدم</th>
                <th className="px-4 py-3 text-start">المدينة</th>
                {opportunity.type === "co_op" && (
                  <>
                    <th className="px-4 py-3 text-start">الجامعة</th>
                    <th className="px-4 py-3 text-start">التخصص</th>
                    <th className="px-4 py-3 text-start">المستوى الدراسي</th>
                  </>
                )}
                {opportunity.type === "job" && (
                  <th className="px-4 py-3 text-start">المؤهل</th>
                )}
                <th className="px-4 py-3 text-start">درجة المناسبة</th>
                {(opportunity.type === "job" || opportunity.type === "volunteering") && (
                  <th className="px-4 py-3 text-start">السيرة الذاتية</th>
                )}
                <th className="px-4 py-3 text-start">الحالة</th>
                <th className="px-4 py-3 text-start">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((app) => (
                <tr key={app.id} className="border-t border-neutral-200 transition-colors hover:bg-primary-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage src={app.applicantProfile.avatarUrl ?? undefined} />
                        <AvatarFallback>{app.applicantProfile.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Link href={`/organization/applicants/${app.applicantProfile.id}`} className="font-medium text-neutral-800 hover:text-primary-700 hover:underline">{app.applicantProfile.fullName}</Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{app.applicantProfile.city}</td>
                  {opportunity.type === "co_op" && (
                    <>
                      <td className="px-4 py-3 text-neutral-600">{app.university}</td>
                      <td className="px-4 py-3 text-neutral-600">{app.major}</td>
                      <td className="px-4 py-3 text-neutral-600">{app.academicLevel}</td>
                    </>
                  )}
                  {opportunity.type === "job" && (
                    <td className="px-4 py-3 text-neutral-600">{app.applicantProfile.qualification}</td>
                  )}
                  <td className="px-4 py-3">
                    <CompatibilityBadge score={app.compatibilityScore ?? 0} />
                  </td>
                  {(opportunity.type === "job" || opportunity.type === "volunteering") && (
                    <td className="px-4 py-3">
                      {app.resumeUrl ? (
                        <a
                          href={resumeLinks.get(app.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-600 hover:underline"
                        >
                          <FileText className="h-4 w-4" /> عرض
                        </a>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2">
                    <Link href={`/organization/applicants/${app.applicantProfile.id}`} aria-label={`عرض ملف ${app.applicantProfile.fullName}`} title="عرض الملف" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-primary-50 hover:text-primary-700"><UserRound className="h-4 w-4" /></Link>
                    <StartConversationButton applicationId={app.id} />
                    {["applied", "under_review", "shortlisted"].includes(app.status) && <ApplicantRowActions applicationId={app.id} canAccept={canAcceptMore} />}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
