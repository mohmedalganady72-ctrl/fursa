"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ICONS, type SidebarNavItem } from "./dashboard-sidebar";

/**
 * نسخة الهاتف من التنقل داخل اللوحات — شريط سفلي ثابت (Bottom Navigation)
 * بدل الشريط الجانبي، وهو نمط أكثر ألفة على الهاتف من قائمة منسدلة (Drawer)
 * لتنقل يستخدمه المستخدم بتكرار عالٍ (لوحة تحكم يومية وليست تصفحًا عرضيًا).
 */
export function DashboardBottomNav({ items }: { items: SidebarNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-neutral-200 bg-surface md:hidden">
      {items.slice(0, 5).map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = NAV_ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-caption",
              isActive ? "text-primary-600" : "text-neutral-500"
            )}
          >
            <span className="relative"><Icon className="h-5 w-5" aria-hidden="true" />{!!item.badge && <span className="absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[9px] font-semibold text-white">{item.badge > 9 ? "9+" : item.badge}</span>}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
