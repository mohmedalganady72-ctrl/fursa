import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { applicantProfiles, users } from "../../lib/db/schema";
import { createTestUser, login } from "./fixtures";

test("يُمنع الباحث من استخدام اللوحة قبل إكمال ملفه", async ({ page }) => {
  const user = await createTestUser("applicant");
  await db.delete(applicantProfiles).where(eq(applicantProfiles.userId, user.id));
  try {
    await login(page, user);
    await page.goto("/applicant/dashboard");
    await expect(page).toHaveURL(/\/applicant\/profile$/);
    await expect(page.getByRole("heading", { name: "ملفي الشخصي" })).toBeVisible();
    const upload = page.getByText("اختيار صورة");
    await expect(upload).toBeVisible();
    expect((await upload.locator("xpath=..").boundingBox())?.height).toBeLessThan(80);
  } finally {
    await db.update(users).set({ isActive: false }).where(eq(users.id, user.id));
  }
});
