import { eq, desc, count, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  organizationProfiles,
  organizationJoinRequests,
  applicantProfiles,
  users,
  admins,
  adminAuditLog,
} from "@/lib/db/schema";
import { createNotification } from "@/features/notifications/services/notifications.service";
import { withDatabaseRetry } from "@/lib/db/retry";
import { accounts } from "@/lib/db/schema";
import { hashPassword } from "better-auth/crypto";

/** حسابات مديري المنصة مع بيانات الدخول الأساسية. */
export async function listAllAdmins() {
  return withDatabaseRetry(() => db.query.admins.findMany({
    with: { user: true },
    orderBy: desc(admins.createdAt),
  }));
}

/** طلبات انضمام الجهات قيد المراجعة (للوحة المدير) */
export async function listPendingJoinRequests(query = "") {
  const rows = await db.query.organizationJoinRequests.findMany({
    where: eq(organizationJoinRequests.status, "pending"),
    with: { organizationProfile: { with: { user: true } } },
    orderBy: desc(organizationJoinRequests.requestedAt),
  });
  const normalized = query.trim().toLocaleLowerCase("ar");
  if (!normalized) return rows;
  return rows.filter(({ organizationProfile: profile }) => [profile.name, profile.city, profile.organizationType, profile.user.email]
    .some((value) => value?.toLocaleLowerCase("ar").includes(normalized)));
}

/**
 * اعتماد جهة — يُفعِّل حسابها بالكامل (organizationProfiles.isApproved + users.isActive)
 * ويرسل إشعارًا فوريًا (راجع وثيقة المتطلبات § "للجهة إشعار عند اكتمال التحقق من الحساب").
 */
export async function approveOrganization(organizationProfileId: string, adminId: string) {
  const orgProfile = await db.query.organizationProfiles.findFirst({
    where: eq(organizationProfiles.id, organizationProfileId),
  });
  if (!orgProfile) throw new Error("ORGANIZATION_NOT_FOUND");

  await db.transaction(async (tx) => {
    await tx
      .update(organizationProfiles)
      .set({ isApproved: true, approvedAt: new Date(), approvedByAdminId: adminId })
      .where(eq(organizationProfiles.id, organizationProfileId));

    await tx.update(users).set({ isActive: true }).where(eq(users.id, orgProfile.userId));

    await tx
      .update(organizationJoinRequests)
      .set({ status: "approved", resolvedAt: new Date() })
      .where(eq(organizationJoinRequests.organizationProfileId, organizationProfileId));
    await tx.insert(adminAuditLog).values({ adminId, action: "organization_approved",
      targetType: "organization_profile", targetId: organizationProfileId });
  });

  await createNotification({
    userId: orgProfile.userId,
    type: "account_verified",
    title: "اعتُمد حساب جهتكم",
    body: "يمكنكم الآن نشر الفٌرص واستقبال طلبات المتقدمين.",
    linkUrl: "/organization/dashboard",
    sendEmail: true,
  }).catch((error) => {
    console.error("[admin] تم اعتماد الجهة لكن تعذّر إرسال الإشعار:", error);
  });

  return orgProfile;
}

/** رفض طلب انضمام جهة، مع سبب اختياري يُعرَض لها */
export async function rejectOrganization(
  organizationProfileId: string,
  adminId: string,
  rejectionReason?: string
) {
  const orgProfile = await db.query.organizationProfiles.findFirst({
    where: eq(organizationProfiles.id, organizationProfileId),
  });
  if (!orgProfile) throw new Error("ORGANIZATION_NOT_FOUND");

  await db.transaction(async (tx) => {
    await tx.update(organizationJoinRequests)
      .set({ status: "rejected", rejectionReason, resolvedAt: new Date() })
      .where(eq(organizationJoinRequests.organizationProfileId, organizationProfileId));
    await tx.insert(adminAuditLog).values({ adminId, action: "organization_rejected",
      targetType: "organization_profile", targetId: organizationProfileId,
      metadata: rejectionReason ? { rejectionReason } : undefined });
  });

  await createNotification({
    userId: orgProfile.userId,
    type: "system_announcement",
    title: "لم يُقبل طلب انضمام جهتكم",
    body: rejectionReason ?? "لم يستوفِ الطلب متطلبات الانضمام للمنصة حاليًا.",
    sendEmail: true,
  }).catch((error) => {
    console.error("[admin] تم رفض الطلب لكن تعذّر إرسال الإشعار:", error);
  });

  return orgProfile;
}

/** قائمة كل الباحثين عن فٌرصة (لصفحة إدارة المستخدمين) */
export async function listAllApplicants(query = "") {
  const rows = await db.query.applicantProfiles.findMany({
    with: { user: true },
    orderBy: desc(applicantProfiles.createdAt),
  });
  const normalized = query.trim().toLocaleLowerCase("ar");
  if (!normalized) return rows;
  return rows.filter((profile) => [profile.fullName, profile.city, profile.qualification, profile.specialization, profile.user.email]
    .some((value) => value?.toLocaleLowerCase("ar").includes(normalized)));
}

/** قائمة كل الجهات (معتمدة وغير معتمدة) */
export async function listAllOrganizations(query = "") {
  const rows = await db.query.organizationProfiles.findMany({
    with: { user: true },
    orderBy: desc(organizationProfiles.createdAt),
  });
  const normalized = query.trim().toLocaleLowerCase("ar");
  if (!normalized) return rows;
  return rows.filter((profile) => [profile.name, profile.city, profile.organizationType, profile.activityDescription, profile.user.email]
    .some((value) => value?.toLocaleLowerCase("ar").includes(normalized)));
}

export async function getOrganizationForAdmin(organizationProfileId: string) {
  return db.query.organizationProfiles.findFirst({
    where: eq(organizationProfiles.id, organizationProfileId),
    with: { user: true },
  });
}

export async function getOrganizationJoinRequestForAdmin(organizationProfileId: string) {
  return db.query.organizationJoinRequests.findFirst({
    where: eq(organizationJoinRequests.organizationProfileId, organizationProfileId),
    orderBy: desc(organizationJoinRequests.requestedAt),
  });
}

/**
 * إنشاء حساب مدير جديد من داخل لوحة التحكم — يتطلب أن يكون الطالب مديرًا حاليًا بالفعل
 * (يُتحقَّق من هذا في الـ route handler عبر middleware/session قبل استدعاء هذه الدالة).
 * يُنشأ حساب الاعتماد وسجل المدير في معاملة واحدة بعد تحقق المسار من المدير الحالي.
 */
export async function createAdminAccount(
  email: string,
  password: string,
  displayName: string,
  createdByAdminId: string,
) {
  const passwordHash = await hashPassword(password);
  return withDatabaseRetry(() => db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({
      email,
      name: displayName,
      role: "admin",
      isActive: true,
      emailVerified: true,
    }).returning({ id: users.id });

    if (!user) throw new Error("ADMIN_CREATE_FAILED");

    await tx.insert(accounts).values({
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: passwordHash,
    });

    const [created] = await tx
      .insert(admins)
      .values({ userId: user.id, displayName, createdByAdminId })
      .returning();

    if (!created) throw new Error("ADMIN_CREATE_FAILED");

    await tx.insert(adminAuditLog).values({ adminId: createdByAdminId, action: "admin_created",
      targetType: "admin", targetId: created.id });

    return created;
  }));
}
