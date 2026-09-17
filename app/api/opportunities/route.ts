import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { isActiveOrganization } from "@/features/auth/services/permissions";
import { opportunitySchema } from "@/features/opportunities/validators/opportunity.schema";
import { opportunityFiltersSchema } from "@/features/opportunities/validators/opportunity-filters.schema";
import { createOpportunity, listOpportunities } from "@/features/opportunities/services/opportunities.service";
import { db } from "@/lib/db";
import { organizationProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/** GET /api/opportunities?type=job&city=...&sortBy=... — قائمة عامة مفلترة (لا يتطلب تسجيل دخول) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = opportunityFiltersSchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_FILTERS", details: parsed.error.flatten() }, { status: 400 });
  }

  const results = await listOpportunities(parsed.data);
  return NextResponse.json({ data: results });
}

/** POST /api/opportunities — إنشاء فٌرصة جديدة (جهة معتمدة ونشطة فقط) */
export async function POST(request: Request) {
  const session = await requireSession();
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

  const created = await createOpportunity(orgProfile.id, parsed.data);
  return NextResponse.json({ data: created }, { status: 201 });
}
