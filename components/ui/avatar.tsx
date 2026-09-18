"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva("relative flex shrink-0 overflow-hidden rounded-full", {
  variants: {
    size: {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-16 w-16",
      xl: "h-24 w-24",
    },
  },
  defaultVariants: { size: "md" },
});

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & VariantProps<typeof avatarVariants>
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root ref={ref} className={cn(avatarVariants({ size }), className)} {...props} />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const avatarFallbackTones = [
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100",
  "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-100",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-100",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-100",
  "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-100",
] as const;

function getFallbackTone(children: React.ReactNode) {
  const seed = typeof children === "string" || typeof children === "number" ? String(children) : "فرصة";
  const hash = Array.from(seed).reduce((value, character) => value * 31 + character.charCodeAt(0), 0);
  return avatarFallbackTones[Math.abs(hash) % avatarFallbackTones.length];
}

// الحرف الأول من اسم المستخدم يُعرض تلقائيًا عند تعذّر تحميل الصورة الشخصية
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => {
  const tone = getFallbackTone(children);

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn("flex h-full w-full items-center justify-center text-body-sm font-semibold", tone, className)}
      {...props}
    >
      {children}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
