import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/** هيكل تحميل مطابق تمامًا لأبعاد OpportunityCard — يمنع "قفزة" التخطيط عند اكتمال الجلب */
export function OpportunityCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-4 w-16 rounded-sm" />
        </div>
      </div>
      <Skeleton className="mt-4 h-5 w-3/4" />
      <div className="mt-4 flex gap-4">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    </Card>
  );
}

/** شبكة من بطاقات هيكلية — تُستخدم في loading.tsx لصفحات تصفح الفٌرص */
export function OpportunityGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <OpportunityCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** هيكل صف جدول (لقائمة المتقدمين لدى الجهة) */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-neutral-100 px-4 py-3">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
