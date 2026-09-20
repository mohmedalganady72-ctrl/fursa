import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireApiSession } from "@/lib/auth/api-session";
import { isApplicant } from "@/features/auth/services/permissions";
import { deleteSavedSearch } from "@/features/opportunities/services/saved-searches.service";
import { db } from "@/lib/db";
import { applicantProfiles } from "@/lib/db/schema";

/** DELETE /api/saved-searches/:savedSearchId — حذف بحث محفوظ للباحث الحالي فقط */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ savedSearchId: string }> }
) {
  const { savedSearchId } = await params;
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  if (!isApplicant(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const profile = await db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.userId, session.user.id),
  });
  if (!profile) return NextResponse.json({ error: "APPLICANT_PROFILE_NOT_FOUND" }, { status: 404 });

  try {
    await deleteSavedSearch(savedSearchId, profile.id);
    return NextResponse.json({ success: true });
  } catch {
    // deleteSavedSearch ترمي خطأ إن لم يوجد السجل أو لم يكن مملوكًا لهذا الباحث (تحقّق ضمن WHERE)
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
