import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, opportunities, conversations, applicationStatusHistory, organizationProfiles, applicantProfiles, users } from "@/lib/db/schema";
import { closePendingApplications, PENDING_STATUSES, type Transaction } from "./status-transitions";
import { createNotification } from "@/features/notifications/services/notifications.service";

const STATUS_LABELS = {
  accepted: "تم قبولك",
  rejected: "تم رفض الطلب",
  under_review: "طلبك قيد المراجعة",
  shortlisted: "تم ترشيحك مبدئياً",
} as const;

async function notifyApplicant(applicationId: string, status: keyof typeof STATUS_LABELS) {
  const [application] = await db
    .select({ userId: applicantProfiles.userId, opportunityTitle: opportunities.title })
    .from(applications)
    .innerJoin(applicantProfiles, eq(applications.applicantProfileId, applicantProfiles.id))
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (!application) return;
  await createNotification({
    userId: application.userId,
    type: "application_status_changed",
    title: STATUS_LABELS[status],
    body: `تم تحديث حالة تقديمك على فرصة ${application.opportunityTitle}`,
    linkUrl: status === "accepted" ? "/applicant/messages" : "/applicant/applications",
  });
}

async function lockApplication(tx: Transaction, applicationId: string, actingUserId: string, applicant = false) {
  const reference = await tx.query.applications.findFirst({ where: eq(applications.id, applicationId) });
  if (!reference) throw new Error("APPLICATION_NOT_FOUND");
  // Lock opportunity before application in every writer to serialize decisions without deadlocks.
  const [opportunity] = await tx.select().from(opportunities)
    .where(eq(opportunities.id, reference.opportunityId)).for("update");
  if (!opportunity) throw new Error("OPPORTUNITY_NOT_FOUND");
  if (applicant) {
    const owner = await tx.query.applicantProfiles.findFirst({
      where: and(eq(applicantProfiles.id, reference.applicantProfileId), eq(applicantProfiles.userId, actingUserId)),
    });
    if (!owner) throw new Error("FORBIDDEN");
  } else {
    const owner = await tx.query.organizationProfiles.findFirst({
      where: and(eq(organizationProfiles.id, opportunity.organizationProfileId),
        eq(organizationProfiles.userId, actingUserId), eq(organizationProfiles.isApproved, true)),
    });
    const user = await tx.query.users.findFirst({ where: eq(users.id, actingUserId) });
    if (!owner || !user?.isActive || user.role !== "organization") throw new Error("FORBIDDEN");
  }
  const [application] = await tx.select().from(applications).where(eq(applications.id, applicationId)).for("update");
  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  if (!PENDING_STATUSES.some((status) => status === application.status)) throw new Error("INVALID_STATUS_TRANSITION");
  return { application, opportunity };
}

export async function acceptApplicant(applicationId: string, actingUserId: string) {
  const updated = await db.transaction(async (tx) => {
    const { application, opportunity } = await lockApplication(tx, applicationId, actingUserId);
    if (opportunity.status !== "published" || opportunity.applicationDeadline <= new Date()) {
      throw new Error("OPPORTUNITY_ALREADY_CLOSED");
    }
    if (opportunity.seatsFilled >= opportunity.seatsAvailable) throw new Error("NO_SEATS_AVAILABLE");
    const full = opportunity.seatsFilled + 1 === opportunity.seatsAvailable;
    await tx.update(opportunities).set({
      seatsFilled: sql`${opportunities.seatsFilled} + 1`,
      ...(full ? { status: "closed" as const, closedAt: new Date(), closureReason: "seats_filled" } : {}),
    }).where(eq(opportunities.id, opportunity.id));
    const [updated] = await tx.update(applications)
      .set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() })
      .where(eq(applications.id, applicationId)).returning();
    await tx.insert(applicationStatusHistory).values({ applicationId, oldStatus: application.status,
      newStatus: "accepted", changedByUserId: actingUserId });
    await tx.insert(conversations).values({ applicationId }).onConflictDoNothing();
    if (full) await closePendingApplications(tx, opportunity.id, actingUserId);
    return updated;
  });
  await notifyApplicant(applicationId, "accepted").catch((error) =>
    console.warn("[applications] تعذّر إنشاء إشعار القبول:", error));
  return updated;
}

async function transitionApplication(applicationId: string, actingUserId: string,
  status: "rejected" | "withdrawn" | "under_review" | "shortlisted") {
  const updated = await db.transaction(async (tx) => {
    const { application, opportunity } = await lockApplication(tx, applicationId, actingUserId, status === "withdrawn");
    if (opportunity.status !== "published" || opportunity.applicationDeadline <= new Date()) throw new Error("OPPORTUNITY_ALREADY_CLOSED");
    if (application.status === status || (status === "under_review" && application.status !== "applied")) {
      throw new Error("INVALID_STATUS_TRANSITION");
    }
    const [updated] = await tx.update(applications).set({ status, updatedAt: new Date(),
      ...(status === "rejected" ? { rejectedAt: new Date() } : {}),
      ...(status === "withdrawn" ? { withdrawnAt: new Date() } : {}),
    }).where(eq(applications.id, applicationId)).returning();
    await tx.insert(applicationStatusHistory).values({ applicationId, oldStatus: application.status,
      newStatus: status, changedByUserId: actingUserId });
    return updated;
  });
  if (status !== "withdrawn") await notifyApplicant(applicationId, status).catch((error) =>
    console.warn("[applications] تعذّر إنشاء إشعار الحالة:", error));
  return updated;
}

export const rejectApplicant = (id: string, actor: string) => transitionApplication(id, actor, "rejected");
export const withdrawApplication = (id: string, actor: string) => transitionApplication(id, actor, "withdrawn");
export const reviewApplication = (id: string, actor: string, status: "under_review" | "shortlisted") => transitionApplication(id, actor, status);
