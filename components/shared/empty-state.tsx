import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * حالة فارغة موحّدة لكل الشاشات (لا نتائج بحث، لا تقديمات بعد، لا إشعارات...).
 * تمنع "الصفحة البيضاء الصامتة" وتوجّه المستخدم لإجراء تالٍ واضح.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-200 px-6 py-16 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
        <Icon className="h-6 w-6 text-neutral-400" aria-hidden="true" />
      </div>
      <h3 className="text-h4 text-neutral-700">{title}</h3>
      {description && (
        <p className="max-w-sm text-body-sm text-secondary">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
