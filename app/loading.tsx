/**
 * حالة التحميل العامة على مستوى المشروع كامل — تظهر تلقائيًا من Next.js
 * أثناء تحميل أي مسار لا يملك loading.tsx خاصًا به.
 * الصفحات ذات المحتوى المعقّد (لوحات التحكم، قوائم الفٌرص) تستبدلها
 * بـ Skeleton مطابق لشكل المحتوى الفعلي (راجع components/shared/loading-skeletons.tsx).
 */
import { PlatformLoader } from "@/components/shared/platform-loader";

export default function Loading() {
  return <PlatformLoader />;
}
