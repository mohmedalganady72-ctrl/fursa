"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  links: Array<{ href: string; label: string }>;
}

/**
 * قائمة الهاتف المنسدلة (Drawer) — تظهر من الجانب المنطقي الصحيح تلقائيًا في RTL
 * بفضل استخدام `end-0` بدل `right-0` (راجع docs/design-system.md § دعم RTL).
 */
export function MobileNav({ isOpen, onClose, links }: MobileNavProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-neutral-900/50 transition-opacity duration-base md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed end-0 top-0 z-50 flex h-auto max-h-[calc(100svh-1rem)] w-72 flex-col gap-1 overflow-y-auto rounded-es-lg bg-surface p-4 shadow-xl transition-transform duration-base md:hidden",
          isOpen ? "translate-x-0" : "hidden"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-h4 text-neutral-800">القائمة</span>
          <button onClick={onClose} aria-label="إغلاق القائمة" className="text-neutral-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="rounded-md px-3 py-2.5 text-body font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            {link.label}
          </Link>
        ))}

        <div className="mt-4 flex flex-col gap-2 border-t border-neutral-200 pt-4">
          <Button variant="outline" asChild>
            <Link href="/login" onClick={onClose}>تسجيل الدخول</Link>
          </Button>
          <Button variant="primary" asChild>
            <Link href="/register" onClick={onClose}>إنشاء حساب</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
