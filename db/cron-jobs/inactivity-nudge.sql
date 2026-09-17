-- ============================================================
-- pg_cron: إرسال رسالة تحفيزية عند عدم نشاط الباحث لأكثر من 3 أيام
-- ============================================================
-- يُنفَّذ يدويًا مرة واحدة في SQL Editor بلوحة Supabase.
-- منطق التحديد الفعلي (مين غير نشط، وما محتوى الرسالة) موجود حصريًا في
-- app/api/cron/inactivity-nudge/route.ts — هذا السكربت يستدعيه فقط.

select cron.schedule(
  'inactivity-nudge',
  '0 9 * * *', -- كل يوم الساعة 9 صباحًا (بتوقيت خادم قاعدة البيانات UTC)
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_DOMAIN/api/cron/inactivity-nudge',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_SECRET',
      'Content-Type', 'application/json'
    )
  );
  $$
);
