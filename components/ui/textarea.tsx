import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

// تُستخدم لحقول النص الحر: "لماذا أنت مناسب لهذه الوظيفة؟"، وصف الفرصة، النبذة الشخصية
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-24 w-full rounded-md border bg-surface px-3 py-2 text-body text-neutral-900 placeholder:text-neutral-400 transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-danger-500" : "border-neutral-200",
          className
        )}
        aria-invalid={error || undefined}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
