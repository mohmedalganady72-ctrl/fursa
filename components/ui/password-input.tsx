"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return <div className="relative">
      <Input ref={ref} type={visible ? "text" : "password"} className={cn("password-input pe-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-neutral-400 transition-colors hover:text-neutral-700"
        aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        title={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>;
  },
);
PasswordInput.displayName = "PasswordInput";
