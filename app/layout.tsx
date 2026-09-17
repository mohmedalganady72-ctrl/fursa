import type { Metadata } from "next";
import { ibmPlexArabic, inter } from "@/styles/fonts";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

/**
 * الميتاداتا الافتراضية للمنصة كاملة. كل صفحة فرعية يمكنها استبدال هذه القيم
 * عبر تصدير `metadata` خاص بها (مثال: عنوان فرصة محددة في صفحة تفاصيلها).
 */
export const metadata: Metadata = {
  title: {
    default: "منصّة الفرص",
    template: "%s | منصّة الفرص",
  },
  description:
    "منصّة ذكية تجمع بين الباحثين عن الفرص والجهات المعلِنة عن فرص العمل والتطوع والتدريب التعاوني",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // dir="rtl" على مستوى <html> — هذا هو المكان الصحيح الوحيد له،
    // وليس على عناصر متفرقة داخل الصفحة (راجع docs/design-system.md § دعم RTL)
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${ibmPlexArabic.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('fursa-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()` }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
