import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { admins, users } from "../../lib/db/schema";
import { createTestUser, login, retryDatabaseOperation } from "./fixtures";

test("يستطيع المدير تعديل بيانات حسابه وتسجيل الدخول بالبريد الجديد", async ({ page }) => {
  const user = await createTestUser("admin");
  const displayName = "مدير الجودة";
  const email = `updated-${user.email}`;

  try {
    await login(page, user);
    await page.goto("/admin/profile");

    await page.getByLabel("الاسم").fill(displayName);
    await page.getByLabel("البريد الإلكتروني").fill(email);

    const updateResponse = page.waitForResponse((response) =>
      response.url().endsWith("/api/admin/profile") && response.request().method() === "PATCH"
    );
    await page.getByRole("button", { name: "حفظ التغييرات" }).click();
    expect((await updateResponse).status()).toBe(200);
    await expect(page.getByText("تم تحديث بيانات حسابك")).toBeVisible();
    await expect(page.getByTitle(displayName)).toBeVisible();
    await expect(page.getByTitle(email)).toBeVisible();

    const [storedUser, storedAdmin] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, user.id) }),
      db.query.admins.findFirst({ where: eq(admins.userId, user.id) }),
    ]);
    expect(storedUser?.name).toBe(displayName);
    expect(storedUser?.email).toBe(email);
    expect(storedAdmin?.displayName).toBe(displayName);

    await page.request.post("/api/auth/sign-out", { headers: { Origin: "http://localhost:3000" } });
    const signIn = await page.request.post("/api/auth/sign-in/email", {
      headers: { Origin: "http://localhost:3000" },
      data: { email, password: user.password, rememberMe: true },
    });
    expect(signIn.status()).toBe(200);
  } finally {
    await retryDatabaseOperation(() => db.update(users).set({ isActive: false }).where(eq(users.id, user.id)));
  }
});
