import { eq } from "drizzle-orm";
import Link from "next/link";
import { FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { DashboardStatCard } from "@/components/charts/dashboard-stat-card";
import { OpportunityCard } from "@/components/shared/opportunity-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { requirePageSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { applicantProfiles } from "@/lib/db/schema";
import { listApplicantApplications } from "@/features/applications/services/applications.service";

/**
 * الصفحة الرئيسية للوحة الباحث — إحصائيات سريعة عن حالة تقديماته
 * + آخر الفٌرص التي قد تهمه (تُستبدل لاحقًا بترتيب "الأكثر مناسبة لي" الفعلي
 * عبر features/matching بمجرد ربط هذه الصفحة بخدمة البحث الذكي الكاملة).
 */
export default async function ApplicantDashboardPage() {
  const session = await requirePageSession();
  const profile = await db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.userId, session.user.id),
  });

  if (!profile) {
    return (
      <EmptyState
        icon={FileText}
        title="أكمل ملفك الشخصي أولًا"
        description="أكمل بيانات ملفك الشخصي للاستفادة من جميع ميزات المنصة."
        actionLabel="إكمال الملف الشخصي"
      />
    );
  }

  const applications = await listApplicantApplications(profile.id);

  const stats = {
    total: applications.length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    // "قيد المراجعة" تشمل كل الحالات التي لم يُبتّ فيها بعد (راجع lib/constants.ts § APPLICATION_STATUS)
    pending: applications.filter((a) =>
      ["applied", "under_review", "shortlisted"].includes(a.status)
    ).length,
    rejected: applications.filter((a) =>
      ["rejected", "withdrawn", "closed"].includes(a.status)
    ).length,
  };

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">مرحبًا، {profile.fullName.split(" ")[0]}</h1>
      <p className="mt-1 text-body text-secondary">نظرة سريعة على تقديماتك</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardStatCard icon={FileText} label="إجمالي الطلبات" value={stats.total} />
        <DashboardStatCard icon={CheckCircle2} label="طلبات مقبولة" value={stats.accepted} />
        <DashboardStatCard icon={Clock} label="قيد المراجعة" value={stats.pending} />
        <DashboardStatCard icon={XCircle} label="طلبات غير مقبولة" value={stats.rejected} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-h3 text-neutral-800">آخر تقديماتك</h2>
        <Button variant="link" asChild>
          <Link href="/applicant/applications">عرض الكل</Link>
        </Button>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="لم تتقدّم إلى أي فٌرصة حتى الآن"
          description="تصفّح الفٌرص المتاحة وقدّم على ما يناسبك"
          actionLabel="تصفّح الفٌرص"
        />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {applications.slice(0, 4).map((app) => (
            <OpportunityCard
              key={app.id}
              id={app.opportunity.id}
              type={app.opportunity.type}
              title={app.opportunity.title}
              organizationName={app.opportunity.organizationProfile?.name ?? ""}
              organizationLogoUrl={app.opportunity.organizationProfile?.logoUrl}
              city={app.opportunity.city}
              workMode={app.opportunity.workMode}
              applicationDeadline={app.opportunity.applicationDeadline}
              href={`/applicant/opportunities/${app.opportunity.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
