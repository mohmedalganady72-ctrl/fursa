import { eq } from "drizzle-orm";
import { USER_ROLES } from "@/lib/constants";
import { db } from "@/lib/db";
import { withDatabaseRetry } from "@/lib/db/retry";
import { applicantProfiles, organizationProfiles } from "@/lib/db/schema";
import type { Session } from "./config";

export async function getPostAuthPath(session: Session) {
  if (session.user.role === USER_ROLES.ADMIN) return "/admin/dashboard";

  if (session.user.role === USER_ROLES.ORGANIZATION) {
    const profile = await withDatabaseRetry(() => db.query.organizationProfiles.findFirst({
      columns: { id: true },
      where: eq(organizationProfiles.userId, session.user.id),
    }));
    return profile ? "/organization/dashboard" : "/organization/profile";
  }

  const profile = await withDatabaseRetry(() => db.query.applicantProfiles.findFirst({
    columns: { id: true },
    where: eq(applicantProfiles.userId, session.user.id),
  }));
  return profile ? "/applicant/dashboard" : "/applicant/profile";
}
