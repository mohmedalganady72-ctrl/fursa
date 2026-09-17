import { cn } from "@/lib/utils";

interface CompatibilityBadgeProps {
  score: number; // 0-100
  className?: string;
}

/**
 * شارة درجة التوافق — التدرّج اللوني موثَّق في docs/design-system.md § مكتبة المكوّنات:
 * ≥85% أخضر (success)، 60-84% كهرماني (warning)، <60% رمادي محايد.
 * تنبيه ثابت مصاحب دائمًا في أي مكان تظهر فيه هذه الشارة للجهة: الدرجة إرشادية وليست قرارًا آليًا.
 */
export function CompatibilityBadge({ score, className }: CompatibilityBadgeProps) {
  const tier = score >= 85 ? "high" : score >= 60 ? "medium" : "low";

  const styles = {
    high: "bg-success-50 text-success-500",
    medium: "bg-warning-50 text-amber-700",
    low: "bg-neutral-100 text-neutral-500",
  }[tier];

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold",
        styles,
        className
      )}
      title="درجة توافق إرشادية بناءً على بيانات ملفك الشخصي"
    >
      <span className="ltr-numerals">{score}%</span>
      <span className="hidden sm:inline">توافق</span>
    </div>
  );
}
