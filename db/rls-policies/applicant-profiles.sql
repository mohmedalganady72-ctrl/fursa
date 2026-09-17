-- ============================================================
-- RLS: applicant_profiles + applicant_fields
-- ============================================================
-- يُنفَّذ هذا السكربت في SQL Editor بلوحة Supabase بعد إنشاء الجداول عبر Drizzle.
-- ملاحظة مهمة: التطبيق يتصل بقاعدة البيانات عبر Drizzle باستخدام اتصال مباشر
-- (DATABASE_URL) وليس عبر عميل Supabase بمصادقة JWT، لذلك معظم منطق التفويض
-- الفعلي مُطبَّق في طبقة التطبيق (features/*/services + lib/auth/session.ts).
-- سياسات RLS هنا تُفعَّل كطبقة دفاع ثانية (Defense in Depth) تحديدًا لحالة استخدام
-- عميل Supabase من المتصفح مباشرة (Realtime channels، الوصول المباشر لـ Storage)،
-- حيث auth.uid() يعكس هوية المستخدم المصادَق عبر Supabase Auth المرتبط بـ Better Auth.

alter table applicant_profiles enable row level security;
alter table applicant_fields enable row level security;

-- كل مستخدم يرى ملفه الشخصي الخاص فقط للتعديل، لكن الجميع يمكنهم القراءة
-- (الملف الشخصي يظهر جزئيًا لجهات تستعرض متقدمين، وبالكامل للجهة صاحبة الفٌرصة)
create policy "applicant_profiles_select_all"
  on applicant_profiles for select
  using (true);

create policy "applicant_profiles_update_own"
  on applicant_profiles for update
  using (auth.uid()::text = user_id::text);

create policy "applicant_profiles_insert_own"
  on applicant_profiles for insert
  with check (auth.uid()::text = user_id::text);

-- applicant_fields يتبع نفس منطق applicant_profiles المرتبط به
create policy "applicant_fields_select_all"
  on applicant_fields for select
  using (true);

create policy "applicant_fields_modify_own"
  on applicant_fields for all
  using (
    exists (
      select 1 from applicant_profiles
      where applicant_profiles.id = applicant_fields.applicant_profile_id
      and applicant_profiles.user_id::text = auth.uid()::text
    )
  );
