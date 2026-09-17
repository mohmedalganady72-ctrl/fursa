import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="فرص - الرئيسية">
    <svg viewBox="0 0 44 44" className={cn("h-10 w-10", inverted ? "text-white" : "text-primary-700")} aria-hidden="true">
      <path d="M7 35V18C7 10.8 12.8 5 20 5h10v7H20c-3.3 0-6 2.7-6 6v17H7Z" fill="currentColor" />
      <path d="M19 35V23c0-4.4 3.6-8 8-8h10v7H27a1 1 0 0 0-1 1v12h-7Z" fill="currentColor" opacity=".72" />
      <circle cx="34" cy="7" r="4" className="fill-accent-500 transition-transform duration-300 group-hover:-translate-y-0.5" />
    </svg>
    <span className={cn("font-heading text-2xl font-bold", inverted ? "text-white" : "text-neutral-900")}>فرص</span>
  </Link>;
}
