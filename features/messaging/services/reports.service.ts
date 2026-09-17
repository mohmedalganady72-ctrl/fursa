import { and, eq, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { reports, adminAuditLog, users } from "@/lib/db/schema";
import type { ReportInput } from "../validators/report.schema";

export async function createReport(reporterId: string, input: ReportInput) {
  const existing = await db.query.reports.findFirst({
    columns: { id: true },
    where: and(
      eq(reports.reporterId, reporterId),
      eq(reports.targetType, input.targetType),
      eq(reports.targetId, input.targetId),
      eq(reports.status, "pending"),
    ),
  });
  if (existing) throw new Error("REPORT_ALREADY_PENDING");

  const [created] = await db
    .insert(reports)
    .values({
      reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
    })
    .returning();

  if (!created) throw new Error("REPORT_CREATE_FAILED");

  return created;
}

/** قائمة البلاغات قيد المراجعة — تُستخدم في لوحة المدير لاحقًا */
export async function listPendingReports() {
  const rows = await db.query.reports.findMany({
    where: eq(reports.status, "pending"),
    with: { reporter: true },
    orderBy: desc(reports.createdAt),
  });
  const userTargetIds = rows.filter((report) => report.targetType === "user").map((report) => report.targetId);
  const targetUsers = userTargetIds.length
    ? await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).where(inArray(users.id, userTargetIds))
    : [];
  const usersById = new Map(targetUsers.map((user) => [user.id, user]));
  return rows.map((report) => ({ ...report, targetUser: report.targetType === "user" ? usersById.get(report.targetId) ?? null : null }));
}

export async function resolveReport(reportId: string, status: "reviewed" | "dismissed", adminId: string) {
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(reports).set({ status }).where(eq(reports.id, reportId)).returning();
    if (!updated) throw new Error("REPORT_NOT_FOUND");
    await tx.insert(adminAuditLog).values({ adminId, action: `report_${status}`,
      targetType: "report", targetId: reportId });
    return updated;
  });
}
