import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { applications } from "../../lib/db/schema";
import { lifecycleFixture, login, retireFixture } from "./fixtures";

test("تستطيع الجهة قبول متقدم من قائمة المتقدمين", async ({ page }) => {
  const fixture = await lifecycleFixture(2);
  try {
    await login(page, fixture.owner);
    await page.goto(`/organization/opportunities/${fixture.opportunity.id}/applicants`);
    await page.getByRole("button", { name: "قبول" }).first().click();
    await expect(page.getByText("تم قبول المتقدم", { exact: true })).toBeVisible();
    expect((await db.query.applications.findMany({ where: eq(applications.opportunityId, fixture.opportunity.id) }))
      .filter((application) => application.status === "accepted")).toHaveLength(1);
  } finally { await retireFixture(fixture); }
});
