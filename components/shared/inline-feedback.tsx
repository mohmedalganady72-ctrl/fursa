import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const feedbackStyles = {
  error: {
    icon: AlertCircle,
    className: "border-danger-500/25 bg-danger-50 text-danger-500 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  },
  success: {
    icon: CheckCircle2,
    className: "border-success-500/25 bg-success-50 text-success-500 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-warning-500/25 bg-warning-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  },
  info: {
    icon: Info,
    className: "border-info-500/25 bg-info-50 text-info-500 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  },
} as const;

interface InlineFeedbackProps {
  variant?: keyof typeof feedbackStyles;
  title?: string;
  message: string;
  id?: string;
  className?: string;
}

export function InlineFeedback({
  variant = "error",
  title,
  message,
  id,
  className,
}: InlineFeedbackProps) {
  const style = feedbackStyles[variant];
  const Icon = style.icon;

  return (
    <div
      id={id}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn("flex animate-fade-in items-start gap-2.5 rounded-md border px-3 py-2.5 text-start text-body-sm", style.className, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <p className={cn("leading-6", title && "mt-0.5")}>{message}</p>
      </div>
    </div>
  );
}
