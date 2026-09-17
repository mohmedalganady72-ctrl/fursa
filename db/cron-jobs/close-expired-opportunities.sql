-- ============================================================
-- pg_cron: وضع حالة "منتهية" (expired) للفٌرص تلقائيًا عند انتهاء موعد التقديم
-- ============================================================
-- ملاحظة تسمية: اسم المهمة/الملف "close-expired-opportunities" تاريخي من إصدار
-- سابق؛ الحالة الفعلية المطبَّقة الآن هي "expired" وليست "closed" — راجع
-- lib/constants.ts § OPPORTUNITY_STATUS للتمييز بين الحالتين.
select cron.schedule(
  'close-expired-opportunities',
  '0 * * * *', -- كل ساعة
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_DOMAIN/api/cron/close-expired-opportunities',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_SECRET',
      'Content-Type', 'application/json'
    )
  );
  $$
);
