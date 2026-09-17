/**
 * نقطة تصدير موحّدة لكل جداول Drizzle schema — يُستورد منها في كل مكان
 * (drizzle.config.ts، lib/db/index.ts، أي service) بدل استيراد كل ملف على حدة.
 */
export * from "./users";
export * from "./auth";
export * from "./fields";
export * from "./applicant-profiles";
export * from "./organization-profiles";
export * from "./organization-join-requests";
export * from "./admins";
export * from "./opportunities";
export * from "./applications";
export * from "./application-status-history";
export * from "./admin-audit-log";
export * from "./saved-opportunities";
export * from "./saved-searches";
export * from "./reports";
export * from "./system-settings";
export * from "./notifications";
export * from "./conversations";
export * from "./messages";
