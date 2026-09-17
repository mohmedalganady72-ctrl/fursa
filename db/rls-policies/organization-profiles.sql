-- ============================================================
-- RLS: organization_profiles
-- ============================================================
alter table organization_profiles enable row level security;

-- الملفات المعتمدة فقط تظهر للعموم (الباحثون)؛ الجهة ترى ملفها الخاص دائمًا بغضّ النظر عن الاعتماد
create policy "organization_profiles_select_approved_or_own"
  on organization_profiles for select
  using (
    is_approved = true
    or auth.uid()::text = user_id::text
  );

create policy "organization_profiles_update_own"
  on organization_profiles for update
  using (auth.uid()::text = user_id::text);

create policy "organization_profiles_insert_own"
  on organization_profiles for insert
  with check (auth.uid()::text = user_id::text);

-- isApproved/approvedByAdminId لا يُعدَّلان أبدًا من الجهة نفسها عبر هذا المسار —
-- التحديث الفعلي لهما يحدث حصريًا عبر service role client في admin.service.ts
-- (راجع lib/supabase/server.ts) الذي يتجاوز RLS بالكامل، لذلك لا حاجة لسياسة UPDATE
-- منفصلة تُقيِّد هذين العمودين تحديدًا على مستوى RLS.
