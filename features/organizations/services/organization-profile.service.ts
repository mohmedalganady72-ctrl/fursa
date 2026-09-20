import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizationProfiles, organizationJoinRequests } from "@/lib/db/schema";
import type { OrganizationProfileInput } from "../validators/organization-profile.schema";

/**
 * إنشاء ملف الجهة لأول مرة — يُنشئ بالتوازي طلب انضمام (organizationJoinRequests)
 * ليظهر في قائمة "طلبات الجهات" لدى المدير (راجع حالات الاستخدام § 10).
 * الحساب يبقى isApproved=false حتى يوافق المدير صراحة.
 */
export async function createOrganizationProfile(userId: string, input: OrganizationProfileInput) {
  return db.transaction(async (tx) => {
  const [created] = await tx
    .insert(organizationProfiles)
    .values({
      userId,
      name: input.name,
      organizationType: input.organizationType,
      city: input.city,
      activityDescription: input.activityDescription,
      logoUrl: input.logoUrl,
    })
    .returning();

  if (!created) throw new Error("ORGANIZATION_PROFILE_CREATE_FAILED");

  await tx.insert(organizationJoinRequests).values({ organizationProfileId: created.id });

  return created;
  });
}

export async function updateOrganizationProfile(
  organizationProfileId: string,
  input: Partial<OrganizationProfileInput> & { logoUrl?: string }
) {
  const [updated] = await db
    .update(organizationProfiles)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(organizationProfiles.id, organizationProfileId))
    .returning();

  if (!updated) throw new Error("ORGANIZATION_PROFILE_NOT_FOUND");

  return updated;
}

export async function getOrganizationProfileByUserId(userId: string) {
  return db.query.organizationProfiles.findFirst({
    where: eq(organizationProfiles.userId, userId),
  });
}
