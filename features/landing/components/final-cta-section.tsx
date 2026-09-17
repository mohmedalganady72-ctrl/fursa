import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { ScrollMotion } from "@/components/shared/scroll-motion";

export function FinalCtaSection() {
  return <section className="relative overflow-hidden px-4 py-20 text-center text-white md:px-6 md:py-28">
    <Image src="/images/landing/riyadh-skyline-footer.webp" alt="أفق مدينة الرياض" fill sizes="100vw" className="object-cover object-center" />
    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,61,48,.98)_0%,rgba(6,92,69,.82)_58%,rgba(6,92,69,.4)_100%)]" />
    <ScrollReveal className="relative mx-auto max-w-3xl"><ScrollMotion speed={38}><h2 className="font-heading text-4xl font-bold md:text-6xl">فرصتك تبدأ الآن</h2><p className="mx-auto mt-5 max-w-xl text-body-lg text-white/80">انضم إلى مجتمع من الطموح والكفاءات والجهات التي تصنع أثرًا في المملكة.</p><Button size="lg" asChild className="mt-8 bg-accent-500 text-neutral-900 hover:bg-accent-600"><Link href="/register">إنشاء حساب <ArrowLeft className="h-4 w-4 rtl-flip" /></Link></Button></ScrollMotion></ScrollReveal>
  </section>;
}
