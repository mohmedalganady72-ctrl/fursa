import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applicantProfiles, applicantFields } from "@/lib/db/schema";
import type { ApplicantProfileInput } from "../validators/applicant-profile.schema";

/** يُنشئ الملف الشخصي لأول مرة (بعد التحقق من البريد مباشرة — راجع حالات الاستخدام § 2) */
export async function createApplicantProfile(userId: string, input: ApplicantProfileInput) {
  return db.transaction(async (tx) => {
  const [created] = await tx
    .insert(applicantProfiles)
    .values({
      userId,
      fullName: input.fullName,
      city: input.city,
      bio: input.bio,
      gender: input.gender,
      qualification: input.qualification,
      specialization: input.specialization,
      avatarUrl: input.avatarUrl,
    })
    .returning();

  if (!created) throw new Error("APPLICANT_PROFILE_CREATE_FAILED");

  if (input.fieldIds.length > 0) {
    await tx.insert(applicantFields).values(
      [...new Set(input.fieldIds)].map((fieldId) => ({ applicantProfileId: created.id, fieldId }))
    );
  }

  return created;
  });
}

/**
 * تحديث الملف الشخصي — يستبدل قائمة المجالات بالكامل (حذف القديم + إدراج الجديد)
 * بدل محاولة حساب الفرق (diff)، لأن الحد الأقصى صغير جدًا (5 مجالات) فالتبسيط هنا
 * أوضح وأقل عرضة للأخطاء من منطق diff غير ضروري التعقيد.
 */
export async function updateApplicantProfile(
  applicantProfileId: string,
  input: ApplicantProfileInput
) {
  return db.transaction(async (tx) => {
  const [updated] = await tx
    .update(applicantProfiles)
    .set({
      fullName: input.fullName,
      city: input.city,
      bio: input.bio,
      gender: input.gender,
      qualification: input.qualification,
      specialization: input.specialization,
      avatarUrl: input.avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(applicantProfiles.id, applicantProfileId))
    .returning();

  if (!updated) throw new Error("APPLICANT_PROFILE_NOT_FOUND");

  await tx.delete(applicantFields).where(eq(applicantFields.applicantProfileId, applicantProfileId));

  if (input.fieldIds.length > 0) {
    await tx.insert(applicantFields).values(
      [...new Set(input.fieldIds)].map((fieldId) => ({ applicantProfileId, fieldId }))
    );
  }

  return updated;
  });
}

export async function getApplicantProfileByUserId(userId: string) {
  return db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.userId, userId),
    with: { applicantFields: { with: { field: true } } },
  });
}
