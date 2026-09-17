"use client";

import { useState, useEffect } from "react";

/**
 * يتتبّع مطابقة media query معيّن (مثال: هل العرض الحالي ≥ md بريكبوينت؟).
 * يُستخدم عند الحاجة لمنطق شرطي في JavaScript يتجاوز ما تقدر عليه كلاسات
 * Tailwind الشرطية وحدها (مثال: تفعيل سلوك مختلف تمامًا للـ hook أو المكوّن
 * حسب حجم الشاشة، وليس فقط تغيير التنسيق البصري).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener("change", handler);

    return () => mediaQueryList.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** اختصار شائع لفحص "هل نحن على الهاتف؟" حسب بريكبوينت md في design-system.md */
export function useIsMobile(): boolean {
  return !useMediaQuery("(min-width: 768px)");
}
