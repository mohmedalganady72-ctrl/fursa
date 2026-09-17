import Link from "next/link";
import { Building2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { JoinRequestActions } from "@/features/admin/components/join-request-actions";
import { AdminSearch } from "@/features/admin/components/admin-search";
import { listPendingJoinRequests } from "@/features/admin/services/admin.service";
import { formatDateArabic } from "@/lib/utils";

const ORG_TYPE_LABELS: Record<string, string> = {
  company: "شركة",
  nonprofit: "منظمة تطوعية",
  academic: "مؤسسة أكاديمية",
  government: "جهة حكومية",
};

/** طلبات انضمام الجهات قيد المراجعة (راجع حالات الاستخدام § "قبول أو رفض الجهات الطالبة للانضمام") */
export default async function OrganizationRequestsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim() ?? "";
  const requests = await listPendingJoinRequests(query);

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">طلبات انضمام الجهات</h1>
      <p className="mt-1 text-body text-secondary">راجع بيانات كل جهة قبل اتخاذ القرار</p>
      <AdminSearch defaultValue={query} placeholder="ابحث باسم الجهة أو المدينة أو البريد" />

      {requests.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Building2} title="لا توجد طلبات معلَّقة حاليًا" />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {requests.map((req) => (
            <Card key={req.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/organizations/${req.organizationProfile.id}`} className="text-h4 text-neutral-800 hover:text-primary-700 hover:underline">{req.organizationProfile.name}</Link>
                  <Badge variant="info">{ORG_TYPE_LABELS[req.organizationProfile.organizationType]}</Badge>
                </div>
                <p className="mt-1 text-body-sm text-secondary">
                  {req.organizationProfile.city} · {req.organizationProfile.user.email}
                </p>
                <p className="mt-1 text-caption text-neutral-400">
                  طلب في {formatDateArabic(req.requestedAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" asChild><Link href={`/admin/organizations/${req.organizationProfile.id}`}><Eye className="h-4 w-4" />عرض الملف</Link></Button>
                <JoinRequestActions organizationProfileId={req.organizationProfile.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
