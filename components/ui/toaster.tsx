"use client";

import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

/** يُوضَع مرة واحدة فقط في app/layout.tsx ليعرض كل الإشعارات النشطة في المشروع */
export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, ...props }) => {
        const normalizedVariant = variant ?? "info";
        const Icon = toastIcons[normalizedVariant];
        return (
        <Toast key={id} variant={normalizedVariant} {...props}>
          <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", iconStyles[normalizedVariant])} aria-hidden="true">
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      )})}
      <ToastViewport />
    </ToastProvider>
  );
}

const toastIcons = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
};

const iconStyles = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  error: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  info: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
};
