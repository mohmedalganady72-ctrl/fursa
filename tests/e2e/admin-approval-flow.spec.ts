import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { organizationProfiles, users } from "../../lib/db/schema";
import { login, pendingOrganizationFixture } from "./fixtures";

test("يستطيع المدير اعتماد جهة من قائمة الطلبات المعلّقة", async ({ page }) => {
  const fixture = await pendingOrganizationFixture();
  try {
    await login(page, fixture.admin);
    await page.goto("/admin/organizations/requests");
    const card = page.getByRole("heading", { name: fixture.organizationName })
      .locator("xpath=ancestor::div[.//button[contains(., 'اعتماد')]][1]");
    await card.getByRole("button", { name: "اعتماد" }).click();
    await expect.poll(async () => (await db.query.organizationProfiles.findFirst({
      where: eq(organizationProfiles.id, fixture.organization.profileId) }))?.isApproved, { timeout: 30_000 }).toBe(true);
  } finally { await db.update(users).set({ isActive: false }).where(eq(users.id, fixture.admin.id)); }
});
