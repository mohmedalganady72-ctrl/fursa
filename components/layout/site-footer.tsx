import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";

const groups = [
  { title: "المنصة", links: [["عن فٌرص", "/#about"], ["كيف تعمل", "/#how-it-works"], ["للجهات", "/#organizations"]] },
  { title: "الدعم", links: [["تواصل معنا", "/contact"], ["سياسة الخصوصية", "/privacy"], ["تسجيل الدخول", "/login"]] },
] as const;

export function SiteFooter() {
  return <footer className="bg-brand-deep text-white">
    <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(2,1fr)]">
        <div><BrandLogo inverted /><p className="mt-4 max-w-sm text-body-sm leading-7 text-white/75">منصة سعودية تجمع الباحثين والجهات في رحلة أوضح من الطموح إلى الفٌرصة.</p></div>
        {groups.map((group) => <div key={group.title} className="flex flex-col gap-3"><span className="font-semibold">{group.title}</span>{group.links.map(([label, href]) => <Link key={href} href={href} className="w-fit text-body-sm text-white/70 transition-colors hover:text-white">{label}</Link>)}</div>)}
      </div>
      <div className="mt-12 flex flex-col gap-2 border-t border-white/20 pt-6 text-caption text-white/65 sm:flex-row sm:justify-between"><span>صُممت في السعودية لطموح يصنع المستقبل.</span><span><span className="ltr-numerals">© {new Date().getFullYear()}</span> فٌرص. جميع الحقوق محفوظة.</span></div>
    </div>
  </footer>;
}
