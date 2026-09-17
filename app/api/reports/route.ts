import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { reportSchema } from "@/features/messaging/validators/report.schema";
import { createReport } from "@/features/messaging/services/reports.service";

/** POST /api/reports — تبليغ عن رسالة/مستخدم/فرصة مخالفة (متاح لأي مستخدم مسجَّل دخوله) */
export async function POST(request: Request) {
  const session = await requireSession();

  const body = await request.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const created = await createReport(session.user.id, parsed.data);
  return NextResponse.json({ data: created }, { status: 201 });
}
