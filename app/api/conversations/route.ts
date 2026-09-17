import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { applications, conversations, opportunities, organizationProfiles } from "@/lib/db/schema";

export async function POST(request: Request) {
  const session = await requireSession();
  const { applicationId } = await request.json().catch(() => ({ applicationId: null }));
  if (typeof applicationId !== "string") return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const [owned] = await db.select({ id: applications.id }).from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .innerJoin(organizationProfiles, eq(opportunities.organizationProfileId, organizationProfiles.id))
    .where(and(eq(applications.id, applicationId), eq(organizationProfiles.userId, session.user.id)))
    .limit(1);
  if (!owned) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  await db.insert(conversations).values({ applicationId }).onConflictDoNothing();
  const conversation = await db.query.conversations.findFirst({ where: eq(conversations.applicationId, applicationId) });
  if (!conversation) return NextResponse.json({ error: "CONVERSATION_CREATE_FAILED" }, { status: 500 });
  return NextResponse.json({ data: { id: conversation.id } }, { status: 201 });
}
