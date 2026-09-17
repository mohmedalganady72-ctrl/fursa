import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollMotion } from "@/components/shared/scroll-motion";

export function HeroSection() {
  return <section className="relative min-h-[calc(100svh-5rem)] overflow-hidden bg-neutral-900">
    <ScrollMotion speed={70} className="absolute -inset-y-10 inset-x-0"><Image src="/images/landing/hero-saudi-team.webp" alt="فريق من الشابات والشباب السعوديين يتعاونون في بيئة عمل حديثة" fill priority sizes="100vw" className="landing-hero-image object-cover object-[62%_center] sm:object-center" /></ScrollMotion>
    <div className="absolute inset-0 bg-neutral-900/50" /><div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(to_right,rgba(18,24,20,.92)_0%,rgba(18,24,20,.66)_46%,rgba(18,24,20,.08)_100%)] lg:w-3/4" />
    <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl items-end px-4 pb-16 pt-24 md:px-6 lg:items-center lg:px-8 lg:py-20">
      <div className="ms-auto max-w-xl text-white"><h1 className="landing-hero-item font-heading text-5xl font-bold leading-[1.2] md:text-6xl lg:text-7xl">فٌرصتك تبدأ<br />من هنا</h1><p className="landing-hero-item mt-6 max-w-lg text-body-lg leading-8 text-white/80 [animation-delay:140ms]">اكتشف فٌرص العمل والتطوع والتدريب التعاوني في مكان واحد، وابنِ مسارك بثقة نحو ما يناسب طموحك.</p>
        <div className="landing-hero-item mt-8 flex flex-wrap gap-3 [animation-delay:260ms]"><Button size="lg" asChild><Link href="/register">ابدأ رحلتك <ArrowLeft className="h-4 w-4 rtl-flip" /></Link></Button><Button size="lg" variant="outline" asChild className="border-white bg-neutral-900/20 text-white hover:bg-white hover:text-neutral-900"><Link href="/#how-it-works">تعرّف على طريقة عملها</Link></Button></div>
      </div>
    </div>
  </section>;
}
