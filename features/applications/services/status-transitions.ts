import { and, eq, inArray } from "drizzle-orm";
import type { db } from "@/lib/db";
import { applications, applicationStatusHistory } from "@/lib/db/schema";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export const PENDING_STATUSES = ["applied", "under_review", "shortlisted"] as const;

// All lifecycle writers hold the opportunity lock before changing its applications.
export async function closePendingApplications(tx: Transaction, opportunityId: string, actorId?: string) {
  const pending = await tx.select({ id: applications.id, status: applications.status })
    .from(applications).where(and(eq(applications.opportunityId, opportunityId),
      inArray(applications.status, [...PENDING_STATUSES]))).for("update");
  if (!pending.length) return;
  await tx.update(applications).set({ status: "closed", updatedAt: new Date() })
    .where(inArray(applications.id, pending.map((row) => row.id)));
  await tx.insert(applicationStatusHistory).values(pending.map((row) => ({
    applicationId: row.id, oldStatus: row.status, newStatus: "closed" as const,
    changedByUserId: actorId,
  })));
}
