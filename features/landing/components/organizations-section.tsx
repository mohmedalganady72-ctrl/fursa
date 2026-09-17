import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { ScrollMotion } from "@/components/shared/scroll-motion";

const benefits = ["نشر منظم لفرص العمل والتطوع والتدريب", "ملفات متقدمين واضحة في لوحة واحدة", "ترتيب إرشادي يساعد فريقك ولا يستبدل قراره"];

export function OrganizationsSection() {
  return <section id="organizations" className="scroll-mt-24 px-4 py-20 md:px-6 md:py-28 lg:px-8"><div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
    <ScrollReveal className="group relative aspect-[4/3] overflow-hidden rounded-md shadow-lg transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-xl"><ScrollMotion speed={44} className="h-full"><Image src="/images/landing/organizations-team.webp" alt="فريق توظيف سعودي يناقش خطط استقطاب الكفاءات" fill sizes="(max-width: 1024px) 100vw, 52vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" /></ScrollMotion></ScrollReveal>
    <ScrollReveal delay={100}><ScrollMotion speed={-24}><span className="text-body-sm font-semibold text-primary-600">للجهات السعودية</span><h2 className="mt-3 font-heading text-4xl font-bold leading-tight text-neutral-900 md:text-5xl">اعثر على الكفاءات واتخذ قرارك بوضوح</h2><p className="mt-5 text-body-lg leading-8 text-secondary">تعرض المنصة لفريقك معلومات واضحة عن كل متقدم، وتسهّل الرحلة من نشر الفرصة إلى اختيار المرشح المناسب.</p>
      <ul className="mt-7 space-y-4">{benefits.map((benefit) => <li key={benefit} className="flex items-start gap-3 text-neutral-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" /><span>{benefit}</span></li>)}</ul>
      <Button size="lg" asChild className="mt-9"><Link href="/register?role=organization">سجّل جهتك <ArrowLeft className="h-4 w-4 rtl-flip" /></Link></Button>
    </ScrollMotion></ScrollReveal>
  </div></section>;
}
