import { getServerSession } from "@/lib/auth/session";
import { getOrganizationProfileByUserId } from "@/features/organizations/services/organization-profile.service";
import { OrganizationProfileForm } from "@/features/organizations/components/organization-profile-form";

export default async function OrganizationProfilePage() {
  const session = await getServerSession();
  const profile = await getOrganizationProfileByUserId(session!.user.id);

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">ملف الجهة</h1>
      <p className="mt-1 text-body text-secondary">ستظهر هذه البيانات للباحثين عند تصفّح فرصكم.</p>

      <div className="mt-6 max-w-2xl">
        <OrganizationProfileForm initialProfile={profile ?? undefined} />
      </div>
    </div>
  );
}
