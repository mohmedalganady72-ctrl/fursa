import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// أنواع الزر وأحجامه — القيم مطابقة لجدول المكوّنات في docs/design-system.md
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-body font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-out [&_svg]:transition-transform [&_svg]:duration-300 hover:-translate-y-0.5 hover:shadow-md hover:[&_svg]:scale-110 active:translate-y-0 active:scale-[0.98] active:shadow-sm focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none motion-reduce:transform-none",
  {
    variants: {
      variant: {
        primary: "bg-primary-600 !text-white hover:bg-primary-700 active:bg-primary-800 dark:bg-primary-300 dark:hover:bg-primary-200 dark:active:bg-primary-100",
        secondary: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
        outline: "border border-neutral-300 bg-transparent text-neutral-800 hover:bg-neutral-50",
        ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100",
        danger: "bg-danger-500 !text-white hover:bg-red-700",
        link: "bg-transparent text-primary-600 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-body-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-body-lg",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** يعرض دوّار تحميل ويعطّل النقر المتكرر أثناء تنفيذ إجراء (مثال: إرسال تقديم) */
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {asChild ? (
          <Slottable>{children}</Slottable>
        ) : (
          <>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
