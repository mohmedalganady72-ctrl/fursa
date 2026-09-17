import { db } from "@/lib/db";
import { OpportunityForm } from "@/features/opportunities/components/opportunity-form";

export default async function NewOpportunityPage() {
  const availableFields = await db.query.fields.findMany();

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">فرصة جديدة</h1>
      <p className="mt-1 text-body text-secondary">
        اختر نوع الفرصة وأكمل تفاصيلها بعناية؛ لا يمكن تعديلها بعد النشر.
      </p>

      <div className="mt-6 max-w-2xl">
        <OpportunityForm availableFields={availableFields} />
      </div>
    </div>
  );
}
