import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";

/**
 * إعداد الخطوط عبر next/font — يُحمَّل الخط ذاتيًا مع البناء (self-hosted)
 * بدل طلبه من خوادم Google وقت التشغيل، ما يحسّن الأداء ويمنع "وميض" الخط (FOUT).
 *
 * IBM Plex Sans Arabic: الخط الأساسي لكل النصوص العربية في المشروع.
 * Inter: يُستخدم للأرقام والمصطلحات الإنجليزية القصيرة داخل الواجهة.
 *
 * الأوزان محصورة عمدًا بأربعة فقط (راجع docs/design-system.md § الطباعة)
 * لتقليل حجم الخطوط المحمَّلة وتثبيت الاتساق البصري.
 */

export const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
