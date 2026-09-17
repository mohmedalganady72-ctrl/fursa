import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { applicantProfiles, organizationProfiles } from "@/lib/db/schema";
import { USER_ROLES } from "@/lib/constants";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  if (session.user.role === USER_ROLES.ADMIN) {
    return NextResponse.json({ data: { path: "/admin/dashboard" } });
  }
  if (session.user.role === USER_ROLES.ORGANIZATION) {
    const profile = await db.query.organizationProfiles.findFirst({ columns: { id: true }, where: eq(organizationProfiles.userId, session.user.id) });
    return NextResponse.json({ data: { path: profile ? "/organization/dashboard" : "/organization/profile" } });
  }
  const profile = await db.query.applicantProfiles.findFirst({ columns: { id: true }, where: eq(applicantProfiles.userId, session.user.id) });
  return NextResponse.json({ data: { path: profile ? "/applicant/dashboard" : "/applicant/profile" } });
}
