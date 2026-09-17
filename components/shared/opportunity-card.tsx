import Link from "next/link";
import { MapPin, Briefcase, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompatibilityBadge } from "./compatibility-badge";
import { SaveButton } from "./save-button";
import { WORK_MODE_LABELS, OPPORTUNITY_TYPE_LABELS, type OpportunityType, type WorkMode } from "@/lib/constants";
import { getRemainingTimeLabel } from "@/lib/utils";

interface OpportunityCardProps {
  id: string;
  type: OpportunityType;
  title: string;
  organizationName: string;
  organizationLogoUrl?: string | null;
  city: string;
  workMode: WorkMode;
  applicationDeadline: Date | string;
  /** تظهر فقط إذا كان المستخدم مسجَّل دخوله كباحث ولديه ملف شخصي كافٍ لحساب التوافق */
  compatibilityScore?: number;
  /** undefined تعني عدم إظهار زر الحفظ إطلاقًا (زائر غير مسجَّل) — نفس نمط compatibilityScore */
  isSaved?: boolean;
  /** يسمح لواجهات الداشبورد بفتح التفاصيل داخل تخطيطها بدل التخطيط العام. */
  href?: string;
}

/**
 * بطاقة الفرصة الموحّدة — تُستخدم في صفحات تصفح الأنواع الثلاثة (عمل/تطوع/تدريب تعاوني)
 * بنفس الشكل تمامًا، والفرق الوحيد هو شارة النوع وحقل درجة التوافق الاختياري.
 */
export function OpportunityCard({
  id,
  type,
  title,
  organizationName,
  organizationLogoUrl,
  city,
  workMode,
  applicationDeadline,
  compatibilityScore,
  isSaved,
  href,
}: OpportunityCardProps) {
  const typeRouteSegment = { job: "jobs", volunteering: "volunteering", co_op: "co-op" }[type];
  const detailsHref = href ?? `/opportunities/${typeRouteSegment}/${id}`;

  return (
    <Link href={detailsHref}>
      <Card className="group h-full p-5 transition-shadow duration-fast hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/*
              صورة: شعار الجهة المعلِنة
              المقاس المقترح: 40×40px (يُعرَض)، يُخزَّن بأصل 128×128px
              الصيغة: PNG شفاف أو WebP
              ملاحظة: عند غياب الشعار، تُعرض دائرة بأول حرف من اسم الجهة كبديل (Fallback)
            */}
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-50 text-body-sm font-semibold text-primary-700">
              {organizationLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- شعارات خارجية من Supabase Storage، تُستبدل بـ next/image عند إعداد remotePatterns الكامل
                <img src={organizationLogoUrl} alt={organizationName} className="h-full w-full object-cover" />
              ) : (
                organizationName.charAt(0)
              )}
            </div>
            <div>
              <p className="text-body-sm font-medium text-neutral-800">{organizationName}</p>
              <Badge variant="info">{OPPORTUNITY_TYPE_LABELS[type]}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {compatibilityScore !== undefined && <CompatibilityBadge score={compatibilityScore} />}
            {isSaved !== undefined && <SaveButton opportunityId={id} initialSaved={isSaved} />}
          </div>
        </div>

        <h3 className="mt-4 text-h4 text-neutral-800 transition-colors group-hover:text-primary-600">
          {title}
        </h3>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-secondary">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {city}
          </span>
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" />
            {WORK_MODE_LABELS[workMode]}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {getRemainingTimeLabel(applicationDeadline)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
