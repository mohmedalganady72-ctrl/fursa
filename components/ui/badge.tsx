import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// شارات دلالية موحّدة — الألوان تحمل معنى ثابتًا في كل الواجهة (راجع design-system.md § الألوان الدلالية)
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-caption font-medium",
  {
    variants: {
      variant: {
        success: "bg-success-50 text-success-500",
        warning: "bg-warning-50 text-amber-700",
        danger: "bg-danger-50 text-danger-500",
        info: "bg-info-50 text-info-500",
        neutral: "bg-neutral-100 text-neutral-600",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
