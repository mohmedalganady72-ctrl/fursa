import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { users, opportunities, applications, applicationStatusHistory } from "../../lib/db/schema";
import { submitApplication } from "../../features/applications/services/applications.service";
import { createTestUser, login, retryDatabaseOperation } from "./fixtures";

test("private APIs return JSON 401 without a session", async ({ request }) => {
  for (const path of ["/api/applicant/profile", "/api/notifications", "/api/opportunities", "/api/admin/settings/daily-application-limit"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(401);
    expect((await response.json()).error).toBe("UNAUTHENTICATED");
  }
});

test("application validation and concurrent duplicate protection", async () => {
  const owner = await createTestUser("organization");
  const applicant = await createTestUser("applicant");
  try {
    const [opportunity] = await db.insert(opportunities).values({
      organizationProfileId: owner.profileId,
      title: "QA guarded submission", description: "Disposable submission verification",
      type: "volunteering", workMode: "remote", city: "الرياض", requiresResume: "true",
      applicationDeadline: new Date(Date.now() + 86400000),
    }).returning();
    const input = { opportunityId: opportunity!.id, opportunityType: "volunteering" as const };
    await expect(submitApplication(applicant.profileId, input)).rejects.toThrow("RESUME_REQUIRED");
    await expect(submitApplication(applicant.profileId, { ...input, resumeUrl: `${owner.id}/resume.pdf` })).rejects.toThrow("INVALID_RESUME_PATH");
    await expect(submitApplication(applicant.profileId, {
      opportunityId: opportunity!.id, opportunityType: "co_op", academicId: "123", academicLevel: "7", university: "QA", major: "QA",
    })).rejects.toThrow("OPPORTUNITY_TYPE_MISMATCH");
    await db.update(opportunities).set({ requiresResume: "false" }).where(eq(opportunities.id, opportunity!.id));
    const attempts = await Promise.allSettled([
      submitApplication(applicant.profileId, input), submitApplication(applicant.profileId, input),
    ]);
    expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rows = await db.select().from(applications).where(eq(applications.opportunityId, opportunity!.id));
    expect(rows).toHaveLength(1);
    const history = await db.select().from(applicationStatusHistory).where(eq(applicationStatusHistory.applicationId, rows[0]!.id));
    expect(history).toHaveLength(1);
  } finally {
    await retryDatabaseOperation(() => db.update(opportunities).set({ status: "closed", closureReason: "qa_completed", closedAt: new Date() })
      .where(eq(opportunities.organizationProfileId, owner.profileId)));
    for (const user of [applicant, owner]) {
      await retryDatabaseOperation(() => db.update(users).set({ isActive: false, isRestricted: true }).where(eq(users.id, user.id)));
    }
  }
});

test("admin logout clears the session and prevents dashboard re-entry", async ({ page }) => {
  const user = await createTestUser("admin");
  try {
    await login(page, user);
    const result = page.waitForResponse((response) => response.url().endsWith("/api/auth/sign-out"));
    await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).filter({ visible: true }).first().click();
    const response = await result;
    expect(response.status()).toBe(200);
    expect(response.request().postDataJSON()).toMatchObject({ disableRedirect: true });
    await expect(page).toHaveURL(/\/admin-login$/);
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin-login/);
    expect((await page.request.get("/api/auth/destination")).status()).toBe(401);
  } finally {
    await retryDatabaseOperation(() => db.update(users).set({ isActive: false, isRestricted: true }).where(eq(users.id, user.id)));
  }
});
