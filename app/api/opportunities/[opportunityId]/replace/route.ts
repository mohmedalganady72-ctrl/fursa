import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireApiSession } from "@/lib/auth/api-session";
import { isActiveOrganization } from "@/features/auth/services/permissions";
import { opportunitySchema } from "@/features/opportunities/validators/opportunity.schema";
import { closeOpportunityAndCreateReplacement } from "@/features/opportunities/services/opportunities.service";
import { db } from "@/lib/db";
import { organizationProfiles } from "@/lib/db/schema";

/**
 * POST /api/opportunities/:id/replace
 * يُغلق الفٌرصة المشار إليها وينشئ فٌرصة جديدة بدلًا منها ضمن معاملة واحدة
 * (راجع وثيقة المتطلبات § 5.7 — لا يوجد تعديل مباشر لفٌرصة منشورة).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const { opportunityId } = await params;
  const session = await requireApiSession();
  if (session instanceof Response) return session;

  if (!isActiveOrganization(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = opportunitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const orgProfile = await db.query.organizationProfiles.findFirst({
    where: eq(organizationProfiles.userId, session.user.id),
  });
  if (!orgProfile) {
    return NextResponse.json({ error: "ORGANIZATION_PROFILE_NOT_FOUND" }, { status: 404 });
  }

  try {
    const replacement = await closeOpportunityAndCreateReplacement(
      opportunityId,
      orgProfile.id,
      parsed.data
    );
    return NextResponse.json({ data: replacement }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "OPPORTUNITY_ALREADY_CLOSED") {
      return NextResponse.json(
        { error: "OPPORTUNITY_ALREADY_CLOSED", message: "هذه الفٌرصة مغلقة بالفعل" },
        { status: 409 }
      );
    }
    if (message === "OPPORTUNITY_NOT_FOUND") {
      return NextResponse.json({ error: "OPPORTUNITY_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ error: "REPLACE_FAILED", message }, { status: 500 });
  }
}
