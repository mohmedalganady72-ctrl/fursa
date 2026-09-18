"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Briefcase,
  Building2,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Sparkles,
  ShieldAlert,
  User,
  Users,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LogoutButton } from "@/components/shared/logout-button";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type DashboardNavIcon =
  | "dashboard"
  | "profile"
  | "applications"
  | "smart-search"
  | "messages"
  | "saved"
  | "organization"
  | "opportunities"
  | "users"
  | "admins"
  | "broadcast"
  | "reports";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: DashboardNavIcon;
  badge?: number;
}

export const NAV_ICONS: Record<DashboardNavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  profile: User,
  applications: FileText,
  "smart-search": Sparkles,
  messages: MessageCircle,
  saved: Bookmark,
  organization: Building2,
  opportunities: Briefcase,
  users: Users,
  admins: UserCog,
  broadcast: Megaphone,
  reports: ShieldAlert,
};

interface DashboardSidebarProps {
  items: SidebarNavItem[];
  user: {
    name: string;
    email: string;
    image?: string | null;
    roleLabel: string;
  };
}

/**
 * شريط تنقل جانبي عام يُعاد استخدامه في لوحات الباحث/الجهة/المدير الثلاث
 * بقوائم عناصر مختلفة (items) لكل واحدة. على الهاتف يُستبدل هذا الشكل
 * بشريط تنقل سفلي (راجع components/layout/mobile-nav.tsx كنمط مرجعي مختلف للسياق).
 */
export function DashboardSidebar({ items, user }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-e border-neutral-200 bg-surface shadow-sm md:block">
      <nav className="sticky top-0 flex flex-col gap-1 p-4">
        <div className="mb-5 flex h-10 items-center justify-between px-2"><BrandLogo /><ThemeToggle /></div>
        <div className="mb-5 flex items-center gap-3 border-y border-neutral-200 px-2 py-4">
          <Avatar size="md" className="ring-2 ring-primary-100">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>{user.name.trim().charAt(0) || "ف"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm font-semibold text-neutral-800" title={user.name}>{user.name}</p>
            <p className="mt-0.5 truncate text-right text-caption text-secondary" dir="ltr" title={user.email}>{user.email}</p>
            <p className="mt-0.5 text-caption text-neutral-400">{user.roleLabel}</p>
          </div>
        </div>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = NAV_ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-body-sm font-medium transition-colors duration-fast",
                isActive
                  ? "bg-primary-100 text-primary-800 shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {!!item.badge && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">{item.badge > 99 ? "99+" : item.badge}</span>}
            </Link>
          );
        })}
        <div className="mt-4 border-t border-neutral-200 pt-3"><LogoutButton showLabel className="justify-start" /></div>
      </nav>
    </aside>
  );
}
