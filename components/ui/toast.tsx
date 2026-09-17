"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed inset-x-0 top-0 z-[100] flex max-h-screen w-full flex-col gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:inset-x-auto sm:bottom-5 sm:end-5 sm:top-auto sm:w-[24rem] sm:p-0",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border bg-surface p-4 pe-11 text-neutral-900 shadow-xl outline-none transition data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-2 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-out data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] dark:bg-[#18231d] dark:text-[#f7faf8] sm:data-[state=open]:slide-in-from-left-4",
  {
    variants: {
      variant: {
        success: "border-emerald-200 border-s-4 border-s-emerald-600 dark:border-emerald-900 dark:border-s-emerald-400",
        error: "border-red-200 border-s-4 border-s-red-600 dark:border-red-950 dark:border-s-red-400",
        warning: "border-amber-200 border-s-4 border-s-amber-500 dark:border-amber-950 dark:border-s-amber-400",
        info: "border-cyan-200 border-s-4 border-s-cyan-600 dark:border-cyan-950 dark:border-s-cyan-400",
      },
    },
    defaultVariants: { variant: "info" },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
));
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn("text-body font-semibold leading-6", className)} {...props} />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn("text-body-sm leading-6 text-neutral-600 dark:text-[#bdc9c1]", className)} {...props} />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    aria-label="إغلاق الرسالة"
    className={cn("absolute end-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none dark:text-[#9eaba3] dark:hover:bg-[#26352d] dark:hover:text-white", className)}
    toast-close=""
    {...props}
  >
    <X className="h-[18px] w-[18px]" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  type ToastProps,
} ;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
