import { expect, test } from "@playwright/test";
import { lifecycleFixture, login, retireFixture } from "./fixtures";

test("البحث عن الفٌرص لا يبدأ إلا بعد الضغط على زر البحث", async ({ page }) => {
  test.setTimeout(180_000);
  const fixture = await lifecycleFixture(2);
  try {
    await login(page, fixture.candidates[0]!);
    await page.goto("/applicant/opportunities");
    await expect(page.getByText("QA lifecycle verification").first()).toBeVisible();

    const widthBeforeSelect = await page.evaluate(() => document.documentElement.clientWidth);
    await page.getByRole("combobox").nth(1).click();
    await expect(page.getByRole("option", { name: "عن بُعد" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(widthBeforeSelect);
    await page.keyboard.press("Escape");

    await page.getByLabel("كلمات البحث").fill("فٌرصة غير موجودة إطلاقاً");
    await expect(page).toHaveURL(/\/applicant\/opportunities$/);
    await expect(page.getByText("QA lifecycle verification").first()).toBeVisible();

    await page.getByRole("button", { name: "بحث", exact: true }).click();
    await expect(page).toHaveURL(/searched=1/);
    await expect(page.getByText("لا توجد نتائج مطابقة")).toBeVisible();
  } finally {
    await retireFixture(fixture);
  }
});
