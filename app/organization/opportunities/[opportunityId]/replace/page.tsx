import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { OpportunityForm } from "@/features/opportunities/components/opportunity-form";
import { getOpportunityById } from "@/features/opportunities/services/opportunities.service";

/**
 * لا يوجد "تعديل" فعلي بعد نشر الفرصة (راجع وثيقة المتطلبات § 5.7). هذه الصفحة
 * تعرض نموذجًا لفرصة جديدة كاملة، وعند الإرسال (راجع OpportunityForm) تُغلَق
 * الفرصة الحالية تلقائيًا وتُنشأ الفرصة الجديدة بدلًا منها — القديمة تبقى
 * كسجل تاريخي مقروء (status: closed, closureReason: "replaced_by_organization")
 * ولا تُحذف أبدًا.
 */
export default async function ReplaceOpportunityPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = await params;
  const [opportunity, availableFields] = await Promise.all([
    getOpportunityById(opportunityId),
    db.query.fields.findMany(),
  ]);

  if (!opportunity) notFound();
  if (opportunity.status === "closed") notFound(); // فرصة مغلقة أصلًا — لا معنى لاستبدالها

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">استبدال الفرصة بنسخة جديدة</h1>
      <p className="mt-1 text-body text-secondary">
        الفرص المنشورة لا يمكن تعديلها مباشرة. عبِّئ البيانات الجديدة أدناه؛ عند
        الإرسال ستُغلَق الفرصة الحالية تلقائيًا وتُستبدَل بهذه النسخة الجديدة.
      </p>

      <Card className="mt-4 flex items-start gap-3 border-warning-500/30 bg-warning-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-body-sm text-amber-800">
          سيتوقف استقبال تقديمات جديدة على الفرصة الحالية فور إرسال هذا النموذج،
          لكن التقديمات الحالية عليها تبقى محفوظة ويمكن مراجعتها من سجل الفرص المغلقة.
        </p>
      </Card>

      <div className="mt-6 max-w-2xl">
        <OpportunityForm
          availableFields={availableFields}
          lockedType={opportunity.type}
          replacesOpportunityId={opportunity.id}
        />
      </div>
    </div>
  );
}
