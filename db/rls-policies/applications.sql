-- ============================================================
-- RLS: applications
-- ============================================================
-- هذا الجدول الأكثر حساسية في المشروع كامل: يجب ألا يرى أي متقدم تفاصيل
-- تقديم متقدم آخر على نفس الفرصة (راجع وثيقة المتطلبات § "لا يستطيع المتقدم
-- فتح ملف البروفايل لمتقدم آخر" — المبدأ نفسه يمتد لبيانات التقديم كاملة).

alter table applications enable row level security;

-- الباحث يرى تقديماته الخاصة فقط
create policy "applications_select_own_as_applicant"
  on applications for select
  using (
    exists (
      select 1 from applicant_profiles
      where applicant_profiles.id = applications.applicant_profile_id
      and applicant_profiles.user_id::text = auth.uid()::text
    )
  );

-- الجهة ترى كل التقديمات على فرصها فقط (وليس فرص جهات أخرى)
create policy "applications_select_own_as_organization"
  on applications for select
  using (
    exists (
      select 1 from opportunities
      join organization_profiles on organization_profiles.id = opportunities.organization_profile_id
      where opportunities.id = applications.opportunity_id
      and organization_profiles.user_id::text = auth.uid()::text
    )
  );

create policy "applications_insert_own"
  on applications for insert
  with check (
    exists (
      select 1 from applicant_profiles
      where applicant_profiles.id = applicant_profile_id
      and applicant_profiles.user_id::text = auth.uid()::text
    )
  );

-- تحديث الحالة (قبول/رفض) مسموح فقط للجهة صاحبة الفرصة
create policy "applications_update_by_owning_organization"
  on applications for update
  using (
    exists (
      select 1 from opportunities
      join organization_profiles on organization_profiles.id = opportunities.organization_profile_id
      where opportunities.id = applications.opportunity_id
      and organization_profiles.user_id::text = auth.uid()::text
    )
  );
