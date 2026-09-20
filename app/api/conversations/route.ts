import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireApiSession } from "@/lib/auth/api-session";
import { db } from "@/lib/db";
import { z } from "zod";
import { isActiveOrganization } from "@/features/auth/services/permissions";
import { applications, conversations, opportunities, organizationProfiles } from "@/lib/db/schema";

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  if (!isActiveOrganization(session)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const parsed = z.object({ applicationId: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const { applicationId } = parsed.data;

  const [owned] = await db.select({ id: applications.id }).from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .innerJoin(organizationProfiles, eq(opportunities.organizationProfileId, organizationProfiles.id))
    .where(and(eq(applications.id, applicationId), eq(organizationProfiles.userId, session.user.id), eq(organizationProfiles.isApproved, true)))
    .limit(1);
  if (!owned) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  await db.insert(conversations).values({ applicationId }).onConflictDoNothing();
  const conversation = await db.query.conversations.findFirst({ where: eq(conversations.applicationId, applicationId) });
  if (!conversation) return NextResponse.json({ error: "CONVERSATION_CREATE_FAILED" }, { status: 500 });
  return NextResponse.json({ data: { id: conversation.id } }, { status: 201 });
}
