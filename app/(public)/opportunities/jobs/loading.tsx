import { OpportunityGridSkeleton } from "@/components/shared/loading-skeletons";

/** حالة تحميل مطابقة لشكل صفحة التصفح الفعلية — تمنع "قفزة" التخطيط عند اكتمال الجلب */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
      <div className="h-9 w-48 animate-pulse rounded-md bg-neutral-200" />
      <div className="mt-2 h-5 w-72 animate-pulse rounded-md bg-neutral-200" />
      <div className="mt-6 h-10 w-full animate-pulse rounded-md bg-neutral-200" />
      <div className="mt-6">
        <OpportunityGridSkeleton />
      </div>
    </div>
  );
}
