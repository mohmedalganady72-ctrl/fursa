import type { NextConfig } from "next";

// إعدادات Next.js الأساسية للمشروع.
// نُبقيها بسيطة عمدًا في هذه المرحلة؛ أي إعداد متقدم (مثل rewrites لخدمات خارجية)
// يُضاف لاحقًا مع الحاجة الفعلية، وليس استباقًا.
const nextConfig: NextConfig = {
  images: {
    // نسمح فقط بنطاق Supabase Storage لتحميل الصور المرفوعة (CV غير مرتبط هنا، فقط الصور)
    // + نطاقات placeholders التطويرية المؤقتة إن استُخدمت أثناء البناء
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // صرامة إضافية أثناء التطوير تكشف مشاكل جانبية (side effects) مبكرًا
  reactStrictMode: true,

  // يمنع تسريب متغيرات البيئة الحساسة عن طريق الخطأ إلى الحزمة الأمامية (bundle)
  // — القيم بدون بادئة NEXT_PUBLIC_ تبقى على الخادم فقط تلقائيًا في Next.js،
  // هذا التعليق توثيقي فقط ليُذكّر أي مطور بالقاعدة عند إضافة متغير جديد.
};

export default nextConfig;
