import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardStatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

/**
 * بطاقة رقم إحصائي واحد — تُستخدم بتكرار في لوحات الباحث/الجهة/المدير الثلاث
 * (مثال: "إجمالي التقديمات"، "الجهات المعتمدة"، "الفرص المفتوحة").
 */
export function DashboardStatCard({ icon: Icon, label, value, trend, className }: DashboardStatCardProps) {
  return (
    <Card className={cn("shadow-xs", className)}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-body-sm text-secondary">{label}</span>
          <div className="flex items-baseline gap-2">
            <span className="ltr-numerals text-h3 text-neutral-800">{value}</span>
            {trend && (
              <span
                className={cn(
                  "ltr-numerals text-caption font-medium",
                  trend.isPositive ? "text-success-500" : "text-danger-500"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
