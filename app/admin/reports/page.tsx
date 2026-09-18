import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ReportActions } from "@/features/admin/components/report-actions";
import { listPendingReports } from "@/features/messaging/services/reports.service";
import { formatDateArabic } from "@/lib/utils";

const TARGET_LABELS = { message: "رسالة", user: "مستخدم", opportunity: "فٌرصة" } as const;

export default async function ReportsPage() {
  const reports = await listPendingReports();
  return <div>
    <h1 className="text-h1 text-neutral-900">البلاغات</h1>
    <p className="mt-1 text-body text-secondary">راجع البلاغات المعلّقة، ثم حدّد الإجراء المناسب.</p>
    {reports.length === 0 ? <div className="mt-6"><EmptyState icon={ShieldAlert} title="لا توجد بلاغات معلّقة" /></div> :
      <div className="mt-6 flex flex-col gap-3">{reports.map((report) =>
        <Card key={report.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-neutral-800">بلاغ عن {TARGET_LABELS[report.targetType]}</p>
              {report.targetUser && <p className="mt-1 text-body-sm text-secondary">الحساب المُبلّغ عنه: {report.targetUser.name || report.targetUser.email} · {report.targetUser.email}</p>}
              <p className="mt-1 whitespace-pre-wrap text-body-sm text-neutral-700">{report.reason}</p>
              <p className="mt-2 text-caption text-neutral-400">{report.reporter.email} · {formatDateArabic(report.createdAt)}</p>
            </div>
            <ReportActions reportId={report.id} />
          </div>
        </Card>)}</div>}
  </div>;
}
