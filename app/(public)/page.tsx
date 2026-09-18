import { HeroSection } from "@/features/landing/components/hero-section";
import { StatementSection } from "@/features/landing/components/statement-section";
import { OpportunityGridSection } from "@/features/landing/components/opportunity-grid-section";
import { HowItWorksSection } from "@/features/landing/components/how-it-works-section";
import { OrganizationsSection } from "@/features/landing/components/organizations-section";
import { FinalCtaSection } from "@/features/landing/components/final-cta-section";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { getPostAuthPath } from "@/lib/auth/destination";

/**
 * الصفحة الرئيسية (Landing) — أول صفحة يراها الزائر غير المسجَّل.
 * الإيقاع البصري: Hero فاتح → بيان مركزي هادئ → شبكة فٌرص تحريرية →
 * كيف تعمل (خلفية رمادية فاتحة) → قسم الجهات (خلفية داكنة) → CTA ختامي.
 * كل قسم مكوّن مستقل في features/landing/components لسهولة التعديل لاحقًا.
 */
export default async function LandingPage() {
  const session = await getServerSession().catch(() => null);
  if (session) redirect(await getPostAuthPath(session));

  return (
    <>
      <HeroSection />
      <StatementSection />
      <OpportunityGridSection />
      <HowItWorksSection />
      <OrganizationsSection />
      <FinalCtaSection />
    </>
  );
}
