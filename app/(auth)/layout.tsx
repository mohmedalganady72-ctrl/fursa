import { BrandLogo } from "@/components/shared/brand-logo";

/**
 * تخطيط بصري مبسّط لصفحات المصادقة — بدون هيدر/فوتر كاملين (تركيز المستخدم
 * على النموذج نفسه)، فقط رابط رجوع للشعار أعلى الصفحة.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <BrandLogo className="mb-8" />

      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
