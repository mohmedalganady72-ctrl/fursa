import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { ScrollMotion } from "@/components/shared/scroll-motion";

export function StatementSection() {
  return <section id="about" className="scroll-mt-20 overflow-hidden bg-surface px-4 py-16 md:px-6 md:py-24"><ScrollReveal className="mx-auto max-w-4xl text-center"><ScrollMotion speed={34}><h2 className="font-heading text-3xl font-bold leading-relaxed text-neutral-900 md:text-5xl">من طلاب الجامعات إلى الخريجين، نفتح أبواب الفرص لنمضي معًا نحو مستقبل أكثر ازدهارًا.</h2><p className="mx-auto mt-6 max-w-2xl text-body-lg text-secondary">«فرص» منصة سعودية تربط طموحك بالجهة المناسبة، وتمنحك طريقًا أوضح نحو خطوتك القادمة.</p></ScrollMotion></ScrollReveal></section>;
}
