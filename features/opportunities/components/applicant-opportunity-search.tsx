"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OPPORTUNITY_SORT_OPTIONS, OPPORTUNITY_TYPE_LABELS, WORK_MODE_LABELS } from "@/lib/constants";

const ALL = "all";
const SORT_LABELS = {
  [OPPORTUNITY_SORT_OPTIONS.NEWEST]: "الأحدث",
  [OPPORTUNITY_SORT_OPTIONS.DEADLINE_SOON]: "الأقرب لانتهاء التقديم",
  [OPPORTUNITY_SORT_OPTIONS.LEAST_APPLIED]: "الأقل تقديمًا عليها",
  [OPPORTUNITY_SORT_OPTIONS.MOST_APPLIED]: "الأكثر تقديمًا عليها",
} as const;

export function ApplicantOpportunitySearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get("searchQuery") ?? "");
  const [type, setType] = React.useState(searchParams.get("type") ?? ALL);
  const [city, setCity] = React.useState(searchParams.get("city") ?? "");
  const [workMode, setWorkMode] = React.useState(searchParams.get("workMode") ?? ALL);
  const [sortBy, setSortBy] = React.useState(searchParams.get("sortBy") ?? OPPORTUNITY_SORT_OPTIONS.NEWEST);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({ searched: "1", sortBy, pageSize: "50" });
    if (query.trim()) params.set("searchQuery", query.trim());
    if (type !== ALL) params.set("type", type);
    if (city.trim()) params.set("city", city.trim());
    if (workMode !== ALL) params.set("workMode", workMode);
    router.push(`${pathname}?${params.toString()}`);
  }

  function reset() {
    setQuery(""); setType(ALL); setCity(""); setWorkMode(ALL); setSortBy(OPPORTUNITY_SORT_OPTIONS.NEWEST);
    router.push(pathname);
  }

  return (
    <form onSubmit={submit} className="mt-6 border-y border-neutral-200 py-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2 md:col-span-2"><Label htmlFor="opportunity-query">كلمات البحث</Label><div className="relative"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><Input id="opportunity-query" value={query} onChange={(event) => setQuery(event.target.value)} className="ps-9" placeholder="المسمى، الجهة أو المؤهل المطلوب" /></div></div>
        <FilterSelect label="نوع الفٌرصة" value={type} onChange={setType} options={{ [ALL]: "كل الأنواع", ...OPPORTUNITY_TYPE_LABELS }} />
        <div className="flex flex-col gap-2"><Label htmlFor="opportunity-city">المدينة</Label><Input id="opportunity-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="مثال: الرياض" /></div>
        <FilterSelect label="نمط العمل" value={workMode} onChange={setWorkMode} options={{ [ALL]: "كل الأنماط", ...WORK_MODE_LABELS }} />
        <FilterSelect label="ترتيب النتائج" value={sortBy} onChange={setSortBy} options={SORT_LABELS} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><Button type="submit"><Search className="h-4 w-4" />بحث</Button><Button type="button" variant="ghost" onClick={reset}><RotateCcw className="h-4 w-4" />إعادة ضبط</Button></div>
    </form>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Record<string, string> }) {
  return <div className="flex flex-col gap-2"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(options).map(([optionValue, optionLabel]) => <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>)}</SelectContent></Select></div>;
}
