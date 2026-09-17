import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { applicantProfiles, users } from "../../lib/db/schema";
import { createTestUser, login, retryDatabaseOperation } from "./fixtures";

test("يُمنع الباحث من استخدام اللوحة قبل إكمال ملفه", async ({ page }) => {
  const user = await createTestUser("applicant");
  await db.delete(applicantProfiles).where(eq(applicantProfiles.userId, user.id));
  try {
    await login(page, user);
    const sessionCookie = (await page.context().cookies()).find((cookie) => cookie.name.endsWith("better-auth.session_token"));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie!.httpOnly).toBe(true);
    expect(sessionCookie!.expires).toBeGreaterThan(Date.now() / 1000 + 29 * 24 * 60 * 60);
    await page.goto("/applicant/dashboard");
    await expect(page).toHaveURL(/\/applicant\/profile$/);
    await expect(page.getByRole("heading", { name: "ملفي الشخصي" })).toBeVisible();
    const upload = page.getByText("اختيار صورة");
    await expect(upload).toBeVisible();
    expect((await upload.locator("xpath=..").boundingBox())?.height).toBeLessThan(80);
  } finally {
    await retryDatabaseOperation(() => db.update(users).set({ isActive: false }).where(eq(users.id, user.id)));
  }
});
