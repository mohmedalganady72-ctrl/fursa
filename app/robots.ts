import type { MetadataRoute } from "next";

/** يمنع فهرسة صفحة دخول المدير ولوحات التحكم الخاصة في محركات البحث */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin-login", "/admin/", "/applicant/", "/organization/", "/api/"],
    },
    sitemap: "https://opportunities-platform.example/sitemap.xml",
  };
}
