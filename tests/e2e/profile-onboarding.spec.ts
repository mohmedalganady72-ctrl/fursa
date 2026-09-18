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
    await expect(page.getByRole("heading", { name: "أكمل ملفك الشخصي" })).toBeVisible();
    await expect(page.getByText("أدخل بياناتك لنتمكن من مساعدتك في العثور على الفرص المناسبة لك.")).toBeVisible();
    const formBox = await page.locator("form").boundingBox();
    const pageBox = await page.locator("body").boundingBox();
    expect(formBox).not.toBeNull();
    expect(pageBox).not.toBeNull();
    expect(Math.abs((formBox!.x + formBox!.width / 2) - (pageBox!.x + pageBox!.width / 2))).toBeLessThan(4);
    const upload = page.getByText("اختيار صورة");
    await expect(upload).toBeVisible();
    expect((await upload.locator("xpath=..").boundingBox())?.height).toBeLessThan(80);
  } finally {
    await retryDatabaseOperation(() => db.update(users).set({ isActive: false }).where(eq(users.id, user.id)));
  }
});
