import type { MetadataRoute } from "next";

/**
 * خريطة موقع أساسية للصفحات العامة الثابتة. صفحات تفاصيل الفٌرص الفردية
 * (opportunities/jobs/[id]...) تُضاف لاحقًا ديناميكيًا عبر استعلام قاعدة البيانات
 * عند نضوج حجم المحتوى بما يستدعي ذلك.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://opportunities-platform.example";

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/opportunities/jobs`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/opportunities/volunteering`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/opportunities/co-op`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
  ];
}
