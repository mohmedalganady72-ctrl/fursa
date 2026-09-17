import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { reports, adminAuditLog } from "@/lib/db/schema";
import type { ReportInput } from "../validators/report.schema";

export async function createReport(reporterId: string, input: ReportInput) {
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
  return db.query.reports.findMany({
    where: eq(reports.status, "pending"),
    with: { reporter: true },
    orderBy: desc(reports.createdAt),
  });
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
