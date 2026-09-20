import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireApiSession } from "@/lib/auth/api-session";
import { isApplicant } from "@/features/auth/services/permissions";
import {
  saveOpportunity,
  unsaveOpportunity,
} from "@/features/opportunities/services/saved-opportunities.service";
import { db } from "@/lib/db";
import { applicantProfiles } from "@/lib/db/schema";

/** POST /api/saved-opportunities/:opportunityId — حفظ فٌرصة */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const { opportunityId } = await params;
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  if (!isApplicant(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const profile = await db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.userId, session.user.id),
  });
  if (!profile) return NextResponse.json({ error: "APPLICANT_PROFILE_NOT_FOUND" }, { status: 404 });

  const saved = await saveOpportunity(profile.id, opportunityId);
  return NextResponse.json({ data: saved }, { status: 201 });
}

/** DELETE /api/saved-opportunities/:opportunityId — إلغاء حفظ */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const { opportunityId } = await params;
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  if (!isApplicant(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const profile = await db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.userId, session.user.id),
  });
  if (!profile) return NextResponse.json({ error: "APPLICANT_PROFILE_NOT_FOUND" }, { status: 404 });

  await unsaveOpportunity(profile.id, opportunityId);
  return NextResponse.json({ success: true });
}
