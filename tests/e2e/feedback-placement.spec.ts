import { expect, test } from "@playwright/test";

test("يظهر خطأ دخول المدير داخل النموذج لا في إشعار عائم", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/admin-login");
  const form = page.locator("form");
  await form.getByLabel("البريد الإلكتروني").fill("unknown@example.invalid");
  await form.locator("#adminPassword").fill("WrongPassword123!");
  await form.getByRole("button", { name: "تسجيل الدخول" }).click();

  const feedback = form.getByRole("alert");
  await expect(feedback).toContainText("تعذّر تسجيل الدخول");
  await expect(feedback).toContainText("تأكد من البريد الإلكتروني وكلمة المرور");
  await expect(page.locator("li[data-state]").filter({ hasText: "تعذّر تسجيل الدخول" })).toHaveCount(0);
  const unexpectedErrors = consoleErrors.filter((message) => !message.includes("status of 401"));
  expect(unexpectedErrors).toEqual([]);
});

test("يظهر عدم تطابق كلمتي المرور تحت حقل التأكيد", async ({ page }) => {
  await page.goto("/register");
  const form = page.locator("form");
  await page.waitForTimeout(1000);
  await form.getByLabel("البريد الإلكتروني").fill("new-user@example.invalid");
  await form.locator("#password").fill("ValidPassword123!");
  await form.locator("#confirm-password").fill("DifferentPassword123!");
  await form.getByRole("button", { name: "إنشاء الحساب", exact: true }).click();

  const confirmInput = form.locator("#confirm-password");
  await expect(confirmInput).toHaveAttribute("aria-invalid", "true");
  await expect(form.locator("#confirm-password-error")).toHaveText("كلمتا المرور غير متطابقتين.");
});
