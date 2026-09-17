import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { users, accounts, applicantProfiles, organizationProfiles, opportunities, applications, fields, admins, organizationJoinRequests } from "../../lib/db/schema";
import type { Page } from "@playwright/test";

export async function createTestUser(role: "applicant" | "organization" | "admin") {
  const id = randomUUID();
  const email = `qa-${id}@example.invalid`;
  const password = `QA-${randomUUID()}-aA1`;
  await db.insert(users).values({ id, email, role, name: "QA verification", emailVerified: true, isActive: true });
  await db.insert(accounts).values({ userId: id, accountId: id, providerId: "credential", password: await hashPassword(password) });
  const profileId = randomUUID();
  if (role === "applicant") await db.insert(applicantProfiles).values({ id: profileId, userId: id, fullName: "باحث اختبار", city: "الرياض" });
  if (role === "organization") await db.insert(organizationProfiles).values({ id: profileId, userId: id, name: "جهة اختبار", city: "الرياض", organizationType: "company", isApproved: true });
  if (role === "admin") await db.insert(admins).values({ id: profileId, userId: id, displayName: "مدير اختبار" });
  return { id, email, password, profileId, role };
}

export async function pendingOrganizationFixture() {
  const admin = await createTestUser("admin");
  const organization = await createTestUser("organization");
  await db.update(organizationProfiles).set({ isApproved: false }).where(eq(organizationProfiles.id, organization.profileId));
  const organizationName = `جهة اختبار ${organization.id.slice(0, 8)}`;
  await db.update(organizationProfiles).set({ name: organizationName }).where(eq(organizationProfiles.id, organization.profileId));
  await db.update(users).set({ isActive: false }).where(eq(users.id, organization.id));
  await db.insert(organizationJoinRequests).values({ organizationProfileId: organization.profileId });
  return { admin, organization, organizationName };
}

export async function login(page: Page, user: Awaited<ReturnType<typeof createTestUser>>) {
  await page.goto(user.role === "admin" ? "/admin-login" : "/login");
  const email = page.getByLabel("البريد الإلكتروني");
  const password = page.getByLabel("كلمة المرور", { exact: true });
  await email.waitFor({ state: "visible" });
  // Next dev can replace the prerendered form once during first-page hydration.
  await page.waitForTimeout(1000);
  await email.fill(user.email);
  await password.fill(user.password);
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/sign-in/email") && response.status() === 200),
    page.getByRole("button", { name: user.role === "admin" ? "دخول" : "تسجيل الدخول", exact: true }).click(),
  ]);
  await page.waitForURL((url) => !["/login", "/admin-login"].includes(url.pathname));
  await page.waitForLoadState("load");
  await page.waitForTimeout(250);
}

export async function lifecycleFixture(seats = 1) {
  const owner = await createTestUser("organization");
  const outsider = await createTestUser("organization");
  const candidates = await Promise.all([createTestUser("applicant"), createTestUser("applicant")]);
  const [opportunity] = await db.insert(opportunities).values({ organizationProfileId: owner.profileId,
    title: "QA lifecycle verification", description: "Integration verification of application lifecycle.",
    type: "volunteering", city: "الرياض", workMode: "remote", seatsAvailable: seats,
    applicationDeadline: new Date(Date.now() + 86400000),
  }).returning();
  if (!opportunity) throw new Error("FIXTURE_FAILED");
  const created = await db.insert(applications).values(candidates.map((candidate) => ({
    opportunityId: opportunity.id, applicantProfileId: candidate.profileId,
  }))).returning();
  const [field] = await db.select().from(fields).limit(1);
  if (!field) throw new Error("FIELDS_NOT_SEEDED");
  return { owner, outsider, candidates, opportunity, applications: created, field };
}

async function retryDatabaseOperation(operation: () => Promise<unknown>) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await operation();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function retireFixture(fixture: Awaited<ReturnType<typeof lifecycleFixture>>) {
  // Preserve audit history and prevent test data appearing in discovery or signing in again.
  await retryDatabaseOperation(() => db.update(opportunities)
    .set({ status: "closed", closedAt: new Date(), closureReason: "qa_completed" })
    .where(eq(opportunities.id, fixture.opportunity.id)));
  for (const user of [fixture.owner, fixture.outsider, ...fixture.candidates]) {
    await retryDatabaseOperation(() => db.update(users).set({ isActive: false }).where(eq(users.id, user.id)));
  }
}
