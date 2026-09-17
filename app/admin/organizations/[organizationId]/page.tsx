import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, CalendarDays, Mail, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JoinRequestActions } from "@/features/admin/components/join-request-actions";
import { getOrganizationForAdmin, getOrganizationJoinRequestForAdmin } from "@/features/admin/services/admin.service";
import { formatDateArabic } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = { company: "شركة", nonprofit: "منظمة غير ربحية", academic: "مؤسسة أكاديمية", government: "جهة حكومية" };

export default async function AdminOrganizationProfilePage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const [organization, request] = await Promise.all([
    getOrganizationForAdmin(organizationId),
    getOrganizationJoinRequestForAdmin(organizationId),
  ]);
  if (!organization) notFound();

  return <div>
    <Button variant="ghost" asChild className="mb-4"><Link href="/admin/organizations/requests"><ArrowRight className="h-4 w-4 rtl-flip" />العودة</Link></Button>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16"><AvatarImage src={organization.logoUrl ?? undefined} /><AvatarFallback><Building2 className="h-6 w-6" /></AvatarFallback></Avatar>
        <div><h1 className="text-h1 text-neutral-900">{organization.name}</h1><div className="mt-2 flex flex-wrap gap-2"><Badge variant="info">{TYPE_LABELS[organization.organizationType]}</Badge><Badge variant={organization.isApproved ? "success" : request?.status === "rejected" ? "danger" : "warning"}>{organization.isApproved ? "معتمدة" : request?.status === "rejected" ? "مرفوضة" : "قيد المراجعة"}</Badge></div></div>
      </div>
      {request?.status === "pending" && <JoinRequestActions organizationProfileId={organization.id} />}
    </div>

    <Card className="mt-6 p-6">
      <h2 className="text-h3 text-neutral-900">معلومات الجهة</h2>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <Info icon={Mail} label="البريد الإلكتروني" value={organization.user.email} ltr />
        <Info icon={MapPin} label="المدينة" value={organization.city} />
        <Info icon={Building2} label="نوع الجهة" value={TYPE_LABELS[organization.organizationType] ?? organization.organizationType} />
        <Info icon={CalendarDays} label="تاريخ التسجيل" value={formatDateArabic(organization.createdAt)} />
      </dl>
      <div className="mt-6 border-t border-neutral-200 pt-5"><dt className="text-body-sm font-semibold text-neutral-700">وصف النشاط</dt><dd className="mt-2 whitespace-pre-wrap text-body leading-7 text-secondary">{organization.activityDescription || "لم تضف الجهة وصفًا لنشاطها."}</dd></div>
      {request?.rejectionReason && <div className="mt-5 rounded-md border border-danger-200 bg-danger-50 p-4"><p className="text-body-sm font-semibold text-danger-700">سبب الرفض</p><p className="mt-1 text-body-sm text-danger-700">{request.rejectionReason}</p></div>}
    </Card>
  </div>;
}

function Info({ icon: Icon, label, value, ltr = false }: { icon: typeof Mail; label: string; value: string; ltr?: boolean }) {
  return <div className="flex gap-3"><Icon className="mt-0.5 h-5 w-5 text-primary-600" /><div><dt className="text-caption text-secondary">{label}</dt><dd dir={ltr ? "ltr" : undefined} className="mt-1 text-body-sm font-medium text-neutral-800">{value}</dd></div></div>;
}
