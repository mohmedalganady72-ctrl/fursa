import { cn } from "@/lib/utils";

/**
 * كتلة تحميل نابضة (pulse) بأبعاد قابلة للتخصيص عبر className.
 * القاعدة: يجب أن تطابق أبعادها المحتوى الفعلي القادم لتفادي "قفزة" في التخطيط
 * عند اكتمال التحميل (راجع design-system.md § مكتبة المكوّنات).
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-neutral-200", className)}
      {...props}
    />
  );
}

export { Skeleton };
