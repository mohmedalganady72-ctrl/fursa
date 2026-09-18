import { requirePageSession } from "@/lib/auth/session";
import { getOrganizationProfileByUserId } from "@/features/organizations/services/organization-profile.service";
import { OrganizationProfileForm } from "@/features/organizations/components/organization-profile-form";

export default async function OrganizationProfilePage() {
  const session = await requirePageSession();
  const profile = await getOrganizationProfileByUserId(session.user.id);

  return (
    <div className={profile ? "" : "mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-10"}>
      <div className={profile ? "" : "text-center"}>
        <h1 className="text-h1 text-neutral-900">{profile ? "ملف الجهة" : "أكمل ملف الجهة"}</h1>
        <p className="mt-2 text-body text-secondary">
          {profile
            ? "ستظهر هذه البيانات للباحثين عند تصفّح فرصكم."
            : "أدخل بيانات الجهة لتتمكن من نشر الفرص والوصول إلى المرشحين المناسبين."}
        </p>
      </div>

      <div className="mt-6 w-full">
        <OrganizationProfileForm initialProfile={profile ?? undefined} />
      </div>
    </div>
  );
}
