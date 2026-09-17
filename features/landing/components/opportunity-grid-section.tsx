import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { ScrollMotion } from "@/components/shared/scroll-motion";

const paths = [
  { title: "الوظائف", description: "فٌرص مهنية تفتح لك أبواب الخبرة والنمو.", href: "/register", image: "/images/landing/opportunity-work.webp", alt: "شاب سعودي يعمل على حاسوبه في مكتب حديث" },
  { title: "التطوع", description: "شارك مهاراتك في مبادرات تصنع أثرًا حقيقيًا.", href: "/register", image: "/images/landing/opportunity-volunteering.webp", alt: "شابة سعودية تشارك في مبادرة تطوعية" },
  { title: "التدريب التعاوني", description: "ابدأ خبرتك العملية قبل التخرج في بيئة تناسب تخصصك.", href: "/register", image: "/images/landing/opportunity-coop.webp", alt: "طالبة سعودية في تدريب هندسي تعاوني" },
] as const;

export function OpportunityGridSection() {
  return <section id="opportunities" className="scroll-mt-20 px-4 py-16 md:px-6 md:py-24 lg:px-8"><div className="mx-auto max-w-7xl">
    <ScrollReveal><ScrollMotion speed={28}><h2 className="font-heading text-4xl font-bold text-neutral-900 md:text-5xl">اختر الطريق الذي يشبه طموحك</h2><p className="mt-4 max-w-2xl text-body-lg text-secondary">ثلاثة مسارات، ووجهة واحدة: فٌرصة تليق بما تستطيع أن تقدمه.</p></ScrollMotion></ScrollReveal>
    <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">{paths.map((item, index) => <ScrollReveal key={item.title} delay={index * 90}><ScrollMotion speed={18 + index * 8}>
      <Link href={item.href} className="group relative block aspect-[4/5] overflow-hidden rounded-md bg-primary-100 shadow-sm transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-2 hover:shadow-xl active:translate-y-0 motion-reduce:transform-none">
        <Image src={item.image} alt={item.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-neutral-900/25 transition-colors duration-500 group-hover:bg-neutral-900/15" /><div className="absolute inset-x-0 bottom-0 bg-black/75 p-5 text-white transition-[padding,background-color] duration-500 group-hover:bg-black/85 group-hover:pb-7">
          <div className="flex items-center justify-between gap-3"><h3 className="font-heading text-2xl font-bold">{item.title}</h3><ArrowLeft className="h-5 w-5 rtl-flip transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" /></div><p className="mt-2 text-body-sm text-white/90">{item.description}</p>
        </div>
      </Link>
    </ScrollMotion></ScrollReveal>)}</div>
  </div></section>;
}
