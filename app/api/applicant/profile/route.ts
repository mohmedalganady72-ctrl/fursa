import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { isApplicant } from "@/features/auth/services/permissions";
import { applicantProfileSchema } from "@/features/applicant-profile/validators/applicant-profile.schema";
import {
  createApplicantProfile,
  updateApplicantProfile,
  getApplicantProfileByUserId,
} from "@/features/applicant-profile/services/applicant-profile.service";

/** GET /api/applicant/profile — الملف الشخصي للمستخدم الحالي */
export async function GET() {
  const session = await requireSession();
  const profile = await getApplicantProfileByUserId(session.user.id);
  return NextResponse.json({ data: profile });
}

/** PATCH /api/applicant/profile — إنشاء أو تحديث (upsert) بحسب وجود الملف مسبقًا */
export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!isApplicant(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = applicantProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await getApplicantProfileByUserId(session.user.id);

  const result = existing
    ? await updateApplicantProfile(existing.id, parsed.data)
    : await createApplicantProfile(session.user.id, parsed.data);

  return NextResponse.json({ data: result });
}
