import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { approveOrganization, rejectOrganization } from "@/features/admin/services/admin.service";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withDatabaseRetry } from "@/lib/db/retry";

/**
 * PATCH /api/organizations/:id/approve
 * body: { decision: "approve" | "reject", rejectionReason?: string }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const { organizationId } = await params;
  const session = await requireSession();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const { decision, rejectionReason } = body;

  try {
    if (decision !== "approve" && decision !== "reject") {
      return NextResponse.json({ error: "INVALID_DECISION", message: "القرار المرسل غير صالح" }, { status: 400 });
    }

    const result = await withDatabaseRetry(async () => {
      const admin = await db.query.admins.findFirst({ where: eq(admins.userId, session.user.id) });
      if (!admin) throw new Error("ADMIN_RECORD_NOT_FOUND");
      return decision === "approve"
        ? approveOrganization(organizationId, admin.id)
        : rejectOrganization(organizationId, admin.id, rejectionReason);
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const publicMessage = message === "ADMIN_RECORD_NOT_FOUND"
      ? "حساب المدير غير مرتبط بسجل إداري"
      : message === "ORGANIZATION_NOT_FOUND"
        ? "تعذّر العثور على ملف الجهة"
        : "تعذّر تنفيذ الإجراء. حاول مرة أخرى بعد لحظات.";
    return NextResponse.json({ error: "APPROVAL_FAILED", message: publicMessage }, { status: message.endsWith("NOT_FOUND") ? 404 : 500 });
  }
}
