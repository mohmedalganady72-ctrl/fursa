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
    <div className={profile ? "" : "mx-auto w-full max-w-2xl px-4 py-8"}>
      <div className={profile ? "" : "text-center"}>
        <h1 className="text-h1 text-neutral-900">{profile ? "ملفي الشخصي" : "أكمل ملفك الشخصي"}</h1>
        <p className="mt-2 text-body text-secondary">
          {profile
            ? "تُستخدم هذه البيانات في البحث الذكي وحساب مدى توافقك مع الفرص."
            : "أدخل بياناتك لنتمكن من مساعدتك في العثور على الفرص المناسبة لك."}
        </p>
      </div>

      <div className="mt-6 w-full">
        <ProfileForm
          initialProfile={profile ?? undefined}
          availableFields={availableFields}
          selectedFieldIds={profile?.applicantFields.map((f) => f.fieldId) ?? []}
        />
      </div>
    </div>
  );
}
