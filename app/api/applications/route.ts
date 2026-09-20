import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireApiSession } from "@/lib/auth/api-session";
import { isApplicant } from "@/features/auth/services/permissions";
import { applicationSchema } from "@/features/applications/validators/application.schema";
import { submitApplication } from "@/features/applications/services/applications.service";
import { db } from "@/lib/db";
import { applicantProfiles } from "@/lib/db/schema";

/** POST /api/applications — تقديم جديد على فٌرصة (باحث فقط) */
export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  if (!isApplicant(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await db.query.applicantProfiles.findFirst({
    where: eq(applicantProfiles.userId, session.user.id),
  });
  if (!profile) {
    return NextResponse.json({ error: "APPLICANT_PROFILE_NOT_FOUND" }, { status: 404 });
  }

  try {
    const created = await submitApplication(profile.id, parsed.data);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    const knownErrors: Record<string, { status: number; userMessage: string }> = {
      OPPORTUNITY_TYPE_MISMATCH: { status: 400, userMessage: "نوع الطلب لا يطابق هذه الفرصة." },
      OPPORTUNITY_NOT_STARTED: { status: 409, userMessage: "لم يبدأ التقديم على هذه الفرصة بعد." },
      RESUME_REQUIRED: { status: 400, userMessage: "أرفق السيرة الذاتية المطلوبة لهذه الفرصة." },
      INVALID_RESUME_PATH: { status: 400, userMessage: "أعد رفع سيرتك الذاتية من حسابك." },
      DAILY_APPLICATION_LIMIT_EXCEEDED: {
        status: 429,
        userMessage: "وصلت إلى الحد اليومي لطلبات هذا النوع من الفٌرص",
      },
      OPPORTUNITY_CLOSED: { status: 409, userMessage: "انتهى موعد التقديم على هذه الفٌرصة" },
      OPPORTUNITY_EXPIRED: { status: 409, userMessage: "انتهى موعد التقديم على هذه الفٌرصة" },
      OPPORTUNITY_NOT_FOUND: { status: 404, userMessage: "الفٌرصة غير موجودة" },
      APPLICATION_ALREADY_EXISTS: { status: 409, userMessage: "سبق أن قدمت على هذه الفٌرصة" },
    };

    const known = knownErrors[message];
    if (known) {
      return NextResponse.json({ error: message, message: known.userMessage }, { status: known.status });
    }

    return NextResponse.json({ error: "SUBMISSION_FAILED", message }, { status: 500 });
  }
}
