import { eq } from "drizzle-orm";
import { USER_ROLES } from "@/lib/constants";
import { db } from "@/lib/db";
import { withDatabaseRetry } from "@/lib/db/retry";
import { applicantProfiles, organizationProfiles, users } from "@/lib/db/schema";
import { safeRedirectForRole } from "./redirects";
import type { Session } from "./config";

export async function getPostAuthPath(session: Session, requestedPath?: string | null) {
  const account = await withDatabaseRetry(() => db.query.users.findFirst({
    columns: { isRestricted: true },
    where: eq(users.id, session.user.id),
  }));
  if (account?.isRestricted) return "/account-restricted";

  if (session.user.role === USER_ROLES.ADMIN) {
    return safeRedirectForRole(requestedPath, USER_ROLES.ADMIN) ?? "/admin/dashboard";
  }

  if (session.user.role === USER_ROLES.ORGANIZATION) {
    const profile = await withDatabaseRetry(() => db.query.organizationProfiles.findFirst({
      columns: { id: true },
      where: eq(organizationProfiles.userId, session.user.id),
    }));
    if (!profile) return "/organization/profile";
    return safeRedirectForRole(requestedPath, USER_ROLES.ORGANIZATION) ?? "/organization/dashboard";
  }

  const profile = await withDatabaseRetry(() => db.query.applicantProfiles.findFirst({
    columns: { id: true },
    where: eq(applicantProfiles.userId, session.user.id),
  }));
  if (!profile) return "/applicant/profile";
  return safeRedirectForRole(requestedPath, USER_ROLES.APPLICANT) ?? "/applicant/dashboard";
}
