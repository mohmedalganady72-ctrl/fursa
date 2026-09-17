"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { MobileNav } from "./mobile-nav";

const NAV_LINKS = [
  { href: "/#about", label: "عن فرص" }, { href: "/#opportunities", label: "المسارات" },
  { href: "/#how-it-works", label: "كيف تعمل" }, { href: "/#organizations", label: "للجهات" },
  { href: "/contact", label: "تواصل معنا" },
];

export function SiteHeader() {
  const [open, setOpen] = React.useState(false);
  return <header className="sticky top-0 z-40 border-b border-neutral-200 bg-surface">
    <div className="mx-auto flex h-20 max-w-7xl items-center gap-8 px-4 md:px-6 lg:px-8">
      <BrandLogo className="shrink-0" />
      <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
        {NAV_LINKS.map((link) => <Link key={link.href} href={link.href} className="rounded-md px-4 py-2 text-body-sm font-medium text-neutral-600 transition-[color,background-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary-50 hover:text-primary-700">{link.label}</Link>)}
      </nav>
      <div className="ms-auto hidden shrink-0 items-center gap-2 md:flex"><ThemeToggle /><Button variant="ghost" asChild><Link href="/login">تسجيل الدخول</Link></Button><Button asChild><Link href="/register">انضم إلى فرص <ArrowLeft className="h-4 w-4 rtl-flip" /></Link></Button></div>
      <div className="ms-auto flex items-center gap-1 md:hidden"><ThemeToggle /><button className="flex h-10 w-10 items-center justify-center rounded-md text-neutral-600" onClick={() => setOpen(true)} aria-label="فتح القائمة"><Menu className="h-5 w-5" /></button></div>
    </div>
    <MobileNav isOpen={open} onClose={() => setOpen(false)} links={NAV_LINKS} />
  </header>;
}
