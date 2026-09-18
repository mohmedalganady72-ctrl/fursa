"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { WORK_MODE_LABELS, OPPORTUNITY_SORT_OPTIONS, WORK_MODES } from "@/lib/constants";

const SORT_LABELS: Record<string, string> = {
  [OPPORTUNITY_SORT_OPTIONS.NEWEST]: "الأحدث",
  [OPPORTUNITY_SORT_OPTIONS.BEST_MATCH]: "الأكثر مناسبة لي",
  [OPPORTUNITY_SORT_OPTIONS.DEADLINE_SOON]: "الأقرب لانتهاء التقديم",
  [OPPORTUNITY_SORT_OPTIONS.LEAST_APPLIED]: "الأقل تقديمًا عليها",
  [OPPORTUNITY_SORT_OPTIONS.MOST_APPLIED]: "الأكثر تقديمًا عليها",
};

/**
 * شريط الفلاتر لصفحة تصفح الفٌرص — يقرأ/يكتب الحالة مباشرة في query params
 * (وليس React state محلي) حتى تكون النتائج قابلة للمشاركة عبر رابط ومتوافقة مع زر الرجوع.
 */
export function OpportunityFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1"); // أي تغيير فلتر يعيد الترقيم لأول صفحة
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="ابحث باسم الجهة أو عنوان الفٌرصة أو التخصص..."
          defaultValue={searchParams.get("searchQuery") ?? ""}
          onChange={(e) => updateFilter("searchQuery", e.target.value)}
          className="ps-9"
        />
      </div>

      <Select
        defaultValue={searchParams.get("workMode") ?? ""}
        onValueChange={(value) => updateFilter("workMode", value)}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="نمط العمل" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("sortBy") ?? OPPORTUNITY_SORT_OPTIONS.NEWEST}
        onValueChange={(value) => updateFilter("sortBy", value)}
      >
        <SelectTrigger className="sm:w-48">
          <SelectValue placeholder="الترتيب" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
