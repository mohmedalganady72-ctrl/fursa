import { ProfileForm } from "@/features/applicant-profile/components/profile-form";
import { getApplicantProfileByUserId } from "@/features/applicant-profile/services/applicant-profile.service";
import { requirePageSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fields } from "@/lib/db/schema";

export default async function ApplicantProfilePage() {
  const session = await requirePageSession();
  const [profile, availableFields] = await Promise.all([
    getApplicantProfileByUserId(session.user.id),
    db.query.fields.findMany(),
  ]);

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">ملفي الشخصي</h1>
      <p className="mt-1 text-body text-secondary">
        هذه البيانات تُستخدم في البحث الذكي وحساب درجة توافقك مع الفرص
      </p>

      <div className="mt-6 max-w-2xl">
        <ProfileForm
          initialProfile={profile ?? undefined}
          availableFields={availableFields}
          selectedFieldIds={profile?.applicantFields.map((f) => f.fieldId) ?? []}
        />
      </div>
    </div>
  );
}
