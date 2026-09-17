import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { isActiveOrganization } from "@/features/auth/services/permissions";
import { applicationDecisionSchema } from "@/features/applications/validators/application.schema";
import { acceptApplicant, rejectApplicant } from "@/features/applications/services/acceptance-lifecycle";

/**
 * PATCH /api/applications/:id/decision
 * قرار الجهة بقبول أو رفض متقدم. لا مهلة انتظار — القبول فوري ونهائي، ويُغلق الفٌرصة
 * تلقائيًا وذريًا إن اكتمل عدد المقاعد المطلوب (راجع acceptance-lifecycle.ts).
 * كلا المسارين (قبول/رفض) يمرّان عبر خدمة دورة الحياة لضمان تسجيلهما في
 * application_status_history دائمًا — لا تحديث مباشر لعمود status من أي route.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { applicationId } = await params;
  const session = await requireSession();

  if (!isActiveOrganization(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = applicationDecisionSchema.safeParse({ applicationId, ...body });
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated =
      parsed.data.decision === "accept"
        ? await acceptApplicant(applicationId, session.user.id)
        : await rejectApplicant(applicationId, session.user.id);

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    const knownErrors: Record<string, { status: number; userMessage: string }> = {
      FORBIDDEN: { status: 403, userMessage: "لا تملك صلاحية اتخاذ قرار بشأن هذا الطلب" },
      INVALID_STATUS_TRANSITION: { status: 409, userMessage: "اتُخذ قرار بشأن هذا الطلب مسبقًا" },
      NO_SEATS_AVAILABLE: { status: 409, userMessage: "لا توجد مقاعد متاحة؛ اكتمل العدد المطلوب" },
      OPPORTUNITY_ALREADY_CLOSED: { status: 409, userMessage: "أُغلقت هذه الفٌرصة بالفعل" },
      ALREADY_ACCEPTED: { status: 409, userMessage: "قُبل هذا المتقدم مسبقًا" },
      APPLICATION_NOT_FOUND: { status: 404, userMessage: "الطلب غير موجود" },
    };

    const known = knownErrors[message];
    if (known) {
      return NextResponse.json({ error: message, message: known.userMessage }, { status: known.status });
    }

    return NextResponse.json({ error: "DECISION_FAILED", message }, { status: 500 });
  }
}
