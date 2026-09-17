import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { isApplicant } from "@/features/auth/services/permissions";
import { savedSearchSchema } from "@/features/opportunities/validators/saved-search.schema";
import {
  createSavedSearch,
  listSavedSearches,
} from "@/features/opportunities/services/saved-searches.service";
import { db } from "@/lib/db";
import { applicantProfiles } from "@/lib/db/schema";

async function getOwnApplicantProfileId(userId: string) {
  const profile = await db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.userId, userId),
  });
  return profile?.id ?? null;
}

/** GET /api/saved-searches — عمليات البحث المحفوظة للباحث الحالي */
export async function GET() {
  const session = await requireSession();
  const profileId = await getOwnApplicantProfileId(session.user.id);
  if (!profileId) return NextResponse.json({ data: [] });

  const results = await listSavedSearches(profileId);
  return NextResponse.json({ data: results });
}

/** POST /api/saved-searches — حفظ بحث جديد */
export async function POST(request: Request) {
  const session = await requireSession();
  if (!isApplicant(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = savedSearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const profileId = await getOwnApplicantProfileId(session.user.id);
  if (!profileId) return NextResponse.json({ error: "APPLICANT_PROFILE_NOT_FOUND" }, { status: 404 });

  const created = await createSavedSearch(profileId, parsed.data);
  return NextResponse.json({ data: created }, { status: 201 });
}
