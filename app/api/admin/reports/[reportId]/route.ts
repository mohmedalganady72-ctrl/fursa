import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireApiSession } from "@/lib/auth/api-session";
import { isAdmin } from "@/features/auth/services/permissions";
import { resolveReport } from "@/features/messaging/services/reports.service";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";

const schema = z.object({ status: z.enum(["reviewed", "dismissed"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  if (!isAdmin(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, session.user.id) });
  if (!admin) return NextResponse.json({ error: "ADMIN_RECORD_NOT_FOUND" }, { status: 404 });
  const { reportId } = await params;
  const result = await resolveReport(reportId, parsed.data.status, admin.id);
  return NextResponse.json({ data: result });
}
