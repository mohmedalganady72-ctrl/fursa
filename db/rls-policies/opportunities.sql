-- ============================================================
-- RLS: opportunities + opportunity_fields
-- ============================================================
alter table opportunities enable row level security;
alter table opportunity_fields enable row level security;

-- الفرص المفتوحة تظهر للجميع؛ الجهة صاحبة الفرصة ترى كل فرصها بغضّ النظر عن الحالة
create policy "opportunities_select_open_or_own"
  on opportunities for select
  using (
    status = 'open'
    or exists (
      select 1 from organization_profiles
      where organization_profiles.id = opportunities.organization_profile_id
      and organization_profiles.user_id::text = auth.uid()::text
    )
  );

create policy "opportunities_insert_own_organization"
  on opportunities for insert
  with check (
    exists (
      select 1 from organization_profiles
      where organization_profiles.id = organization_profile_id
      and organization_profiles.user_id::text = auth.uid()::text
      and organization_profiles.is_approved = true
    )
  );

create policy "opportunities_update_own_organization"
  on opportunities for update
  using (
    exists (
      select 1 from organization_profiles
      where organization_profiles.id = opportunities.organization_profile_id
      and organization_profiles.user_id::text = auth.uid()::text
    )
  );

create policy "opportunity_fields_select_all"
  on opportunity_fields for select
  using (true);
