import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowRight, BriefcaseBusiness, ExternalLink, FileText, GraduationCap, Languages, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { applicantProfiles, applications, opportunities, organizationProfiles } from "@/lib/db/schema";
import { getSignedUrl, STORAGE_BUCKETS } from "@/lib/supabase/storage";

export default async function OrganizationApplicantProfilePage({ params }: { params: Promise<{ applicantProfileId: string }> }) {
  const { applicantProfileId } = await params;
  const session = await requireSession();
  const authorized = await db.select({ id: applications.id }).from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .innerJoin(organizationProfiles, eq(opportunities.organizationProfileId, organizationProfiles.id))
    .where(and(eq(applications.applicantProfileId, applicantProfileId), eq(organizationProfiles.userId, session.user.id)))
    .limit(1);
  if (!authorized.length) notFound();

  const profile = await db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.id, applicantProfileId),
    with: { applicantFields: { with: { field: true } } },
  });
  if (!profile) notFound();
  const resumeUrl = profile.resumeUrl ? await getSignedUrl({ bucket: STORAGE_BUCKETS.RESUMES, path: profile.resumeUrl }) : null;

  return <div className="mx-auto max-w-4xl">
    <Button variant="ghost" asChild className="mb-4"><Link href="/organization/opportunities"><ArrowRight className="h-4 w-4 rtl-flip" />العودة إلى الفرص</Link></Button>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4"><Avatar size="xl"><AvatarImage src={profile.avatarUrl ?? undefined} /><AvatarFallback className="text-h3">{profile.fullName.charAt(0)}</AvatarFallback></Avatar><div><h1 className="text-h1 text-neutral-900">{profile.fullName}</h1><p className="mt-1 flex items-center gap-1.5 text-body-sm text-secondary"><MapPin className="h-4 w-4" />{profile.city}</p></div></div>
      {resumeUrl && <Button asChild><a href={resumeUrl} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4" />عرض السيرة الذاتية</a></Button>}
    </div>
    <div className="mt-6 grid gap-5 md:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        <Section title="نبذة شخصية"><p className="whitespace-pre-wrap text-body leading-7 text-secondary">{profile.bio || "لم يضف المتقدم نبذة شخصية."}</p></Section>
        <Section title="المهارات"><TagList values={profile.skills ?? []} empty="لم تُضف مهارات" /></Section>
        <Section title="الخبرات"><TextList values={profile.experiences ?? []} empty="لم تُضف خبرات" /></Section>
        <Section title="الدورات والشهادات"><TextList values={profile.certifications ?? []} empty="لم تُضف دورات أو شهادات" /></Section>
      </div>
      <div className="space-y-5">
        <Section title="التعليم"><Info icon={GraduationCap} value={profile.qualification} /><Info icon={BriefcaseBusiness} value={profile.specialization} /><Info icon={GraduationCap} value={profile.university} /></Section>
        <Section title="المجالات"><TagList values={profile.applicantFields.map((item) => item.field.nameAr)} empty="لم تُحدد مجالات" /></Section>
        <Section title="اللغات"><TagList values={profile.languages ?? []} empty="لم تُضف لغات" icon={Languages} /></Section>
        {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) && <Section title="الروابط"><ProfileLinks profile={profile} /></Section>}
      </div>
    </div>
  </div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <Card className="p-5"><h2 className="text-h4 text-neutral-800">{title}</h2><div className="mt-4">{children}</div></Card>; }
function TagList({ values, empty, icon: Icon }: { values: string[]; empty: string; icon?: typeof Languages }) { return values.length ? <div className="flex flex-wrap gap-2">{values.map((value) => <Badge key={value} variant="info">{Icon && <Icon className="h-3 w-3" />}{value}</Badge>)}</div> : <p className="text-body-sm text-secondary">{empty}</p>; }
function TextList({ values, empty }: { values: string[]; empty: string }) { return values.length ? <ul className="space-y-2 text-body-sm text-secondary">{values.map((value, index) => <li key={`${value}-${index}`} className="border-s-2 border-primary-200 ps-3">{value}</li>)}</ul> : <p className="text-body-sm text-secondary">{empty}</p>; }
function Info({ icon: Icon, value }: { icon: typeof GraduationCap; value: string | null }) { return value ? <p className="mb-3 flex items-center gap-2 text-body-sm text-secondary"><Icon className="h-4 w-4 text-primary-600" />{value}</p> : null; }
function ProfileLinks({ profile }: { profile: { linkedinUrl: string | null; githubUrl: string | null; portfolioUrl: string | null } }) { return <div className="flex flex-col gap-2">{[["LinkedIn", profile.linkedinUrl], ["GitHub", profile.githubUrl], ["معرض الأعمال", profile.portfolioUrl]].filter((item): item is [string, string] => Boolean(item[1])).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-body-sm text-primary-700 hover:underline">{label}<ExternalLink className="h-3.5 w-3.5" /></a>)}</div>; }
