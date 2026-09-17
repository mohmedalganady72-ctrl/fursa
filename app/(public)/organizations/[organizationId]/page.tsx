import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { MapPin, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { organizationProfiles } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/constants";

const ORG_TYPE_LABELS: Record<string, string> = {
  company: "شركة",
  nonprofit: "منظمة تطوعية",
  academic: "مؤسسة أكاديمية",
  government: "جهة حكومية",
};

/**
 * الملف التعريفي العام لجهة — يستطيع أي باحث فتحه من بطاقة الفرصة
 * (راجع حالات الاستخدام § "يستطيع الباحثين... عرض بيانات الشركة").
 */
export default async function OrganizationPublicProfilePage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const session = await requireSession();
  if (session.user.role !== USER_ROLES.APPLICANT) notFound();

  const organization = await db.query.organizationProfiles.findFirst({
    where: eq(organizationProfiles.id, organizationId),
  });

  if (!organization || !organization.isApproved) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary-50 text-h3 font-semibold text-primary-700">
          {organization.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={organization.logoUrl} alt={organization.name} className="h-full w-full object-cover" />
          ) : (
            organization.name.charAt(0)
          )}
        </div>
        <div>
          <h1 className="text-h2 text-neutral-900">{organization.name}</h1>
          <div className="mt-1 flex items-center gap-4 text-body-sm text-secondary">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {ORG_TYPE_LABELS[organization.organizationType]}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {organization.city}
            </span>
          </div>
        </div>
      </div>

      {organization.activityDescription && (
        <Card className="mt-6 p-6">
          <h2 className="text-h4 text-neutral-800">نبذة عن الجهة</h2>
          <p className="mt-2 whitespace-pre-line text-body text-neutral-700">
            {organization.activityDescription}
          </p>
        </Card>
      )}
    </div>
  );
}
