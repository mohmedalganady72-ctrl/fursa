import { Search, Send, UserRoundCheck } from "lucide-react";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { ScrollMotion } from "@/components/shared/scroll-motion";

const steps = [
  { number: "01", icon: UserRoundCheck, title: "عرّفنا بطموحك", description: "أنشئ حسابك وأكمل ملفًا يعكس تخصصك ومهاراتك وما تبحث عنه." },
  { number: "02", icon: Search, title: "اكتشف ما يناسبك", description: "تظهر لك الفرص في لوحة الباحث مع بحث وفلاتر واضحة بعد اكتمال حسابك." },
  { number: "03", icon: Send, title: "قدّم وتابع بثقة", description: "أرسل طلبك مرة واحدة، ثم تابع حالته ورسائل الجهة من مكان واحد." },
] as const;

export function HowItWorksSection() {
  return <section id="how-it-works" className="scroll-mt-24 overflow-hidden border-y border-neutral-200 bg-neutral-50 px-4 py-20 md:px-6 md:py-28 lg:px-8"><div className="mx-auto max-w-7xl">
    <ScrollReveal className="mx-auto max-w-2xl text-center"><h2 className="font-heading text-4xl font-bold text-neutral-900 md:text-5xl">من حسابك إلى فرصتك، بخطوات واضحة</h2><p className="mt-4 text-body-lg text-secondary">صممنا الرحلة لتبقى أنت مركزها، من أول معلومة حتى متابعة طلبك.</p></ScrollReveal>
    <div className="relative mt-16 grid gap-8 md:grid-cols-3 md:gap-10">
      <div className="absolute inset-x-[16%] top-9 hidden h-px bg-primary-200 md:block" />
      {steps.map((step, index) => <ScrollReveal key={step.number} delay={index * 120} className="relative text-center"><ScrollMotion speed={16 + index * 7}>
        <div className="group relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-primary-200 bg-surface shadow-sm transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-1 hover:scale-105 hover:border-primary-400 hover:shadow-lg motion-reduce:transform-none"><step.icon className="h-7 w-7 text-primary-600 transition-[color,transform] duration-500 group-hover:scale-110 group-hover:text-primary-700" /><span className="ltr-numerals absolute -end-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-caption font-bold text-neutral-900 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110">{step.number}</span></div>
        <h3 className="mt-6 text-h3 text-neutral-900">{step.title}</h3><p className="mx-auto mt-3 max-w-xs text-body leading-7 text-secondary">{step.description}</p>
      </ScrollMotion></ScrollReveal>)}
    </div>
  </div></section>;
}
