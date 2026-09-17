"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const countries = [
  { code: "SA", name: "السعودية", dial: "+966", flag: "🇸🇦", placeholder: "5XXXXXXXX" },
  { code: "AE", name: "الإمارات", dial: "+971", flag: "🇦🇪", placeholder: "5XXXXXXXX" },
  { code: "KW", name: "الكويت", dial: "+965", flag: "🇰🇼", placeholder: "XXXXXXXX" },
  { code: "BH", name: "البحرين", dial: "+973", flag: "🇧🇭", placeholder: "XXXXXXXX" },
  { code: "QA", name: "قطر", dial: "+974", flag: "🇶🇦", placeholder: "XXXXXXXX" },
  { code: "OM", name: "عُمان", dial: "+968", flag: "🇴🇲", placeholder: "XXXXXXXX" },
  { code: "EG", name: "مصر", dial: "+20", flag: "🇪🇬", placeholder: "1XXXXXXXXX" },
  { code: "JO", name: "الأردن", dial: "+962", flag: "🇯🇴", placeholder: "7XXXXXXXX" },
] as const;

export function CountryPhoneInput({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [countryCode, setCountryCode] = React.useState("SA");
  const country = countries.find((item) => item.code === countryCode) ?? countries[0];
  const nationalNumber = value.startsWith(country.dial) ? value.slice(country.dial.length) : value.replace(/^\+\d{1,3}/, "");

  function updateNumber(raw: string, dial = country.dial) {
    const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
    onChange(digits ? `${dial}${digits}` : "");
  }

  return <div className="flex flex-col gap-2">
    <Label htmlFor={id}>رقم الهاتف</Label>
    <div className="flex h-11 overflow-hidden rounded-md border border-neutral-300 bg-surface focus-within:ring-2 focus-within:ring-primary-500">
      <div className="relative shrink-0 border-e border-neutral-200">
        <select dir="rtl" aria-label="الدولة" value={countryCode} onChange={(event) => { const next = countries.find((item) => item.code === event.target.value) ?? countries[0]; setCountryCode(next.code); updateNumber(nationalNumber, next.dial); }} className="h-full appearance-none bg-neutral-50 ps-3 pe-9 text-right text-body-sm font-medium text-neutral-800 outline-none">
          {countries.map((item) => <option key={item.code} value={item.code}>{item.flag} {item.dial} {item.name}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute end-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
      </div>
      <Input id={id} type="tel" inputMode="numeric" dir="ltr" autoComplete="tel-national" value={nationalNumber} onChange={(event) => updateNumber(event.target.value)} required placeholder={country.placeholder} className="h-full rounded-none border-0 text-start shadow-none focus-visible:ring-0" />
    </div>
    <p className="text-caption text-secondary">سيُرسل رمز تحقق برسالة SMS إلى <span dir="ltr">{value || `${country.dial}…`}</span></p>
  </div>;
}
