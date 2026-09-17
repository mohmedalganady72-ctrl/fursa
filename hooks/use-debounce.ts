"use client";

import { useState, useEffect } from "react";

/**
 * يؤخّر تحديث القيمة حتى يتوقف المستخدم عن الكتابة لمدة delay مللي ثانية.
 * يُستخدم في حقل البحث النصي لصفحات تصفح الفرص لتفادي إرسال طلب API
 * مع كل ضغطة زر (راجع features/opportunities/components/opportunity-filters.tsx
 * كمرشح لاستخدام هذا الـ hook عند ربطه بجلب بيانات حي بدل تنقّل الصفحة الكامل).
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}
