import { expect, test } from "@playwright/test";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../lib/db";
import { adminAuditLog, admins, users } from "../../lib/db/schema";
import { createTestUser, login, retryDatabaseOperation } from "./fixtures";

test("يقيّد المدير حسابًا مفتوح الجلسة ثم يعيد تمكينه", async ({ browser }) => {
  test.setTimeout(240_000);
  const adminUser = await createTestUser("admin");
  const applicant = await createTestUser("applicant");
  const adminContext = await browser.newContext();
  const applicantContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  const applicantPage = await applicantContext.newPage();

  try {
    await login(applicantPage, applicant);
    await expect(applicantPage).toHaveURL(/\/applicant\/dashboard$/);

    await login(adminPage, adminUser);
    await adminPage.goto(`/admin/users/applicants?q=${encodeURIComponent(applicant.email)}`);
    const applicantCard = adminPage.locator("article, [class*='border']").filter({ hasText: applicant.email }).first();
    await applicantCard.getByRole("button", { name: "تقييد" }).click();
    await adminPage.getByRole("button", { name: "تأكيد التقييد" }).click();
    await expect(applicantCard.getByRole("button", { name: "تمكين" })).toBeVisible();

    await applicantPage.reload();
    await expect(applicantPage).toHaveURL(/\/account-restricted$/);
    await expect(applicantPage.getByRole("heading", { name: "حسابك مقيّد مؤقتًا" })).toBeVisible();
    await expect(applicantPage.getByRole("link", { name: "التواصل مع الدعم" })).toBeVisible();

    await adminPage.getByRole("button", { name: "تمكين" }).click();
    await adminPage.getByRole("button", { name: "تأكيد التمكين" }).click();
    await expect(applicantCard.getByRole("button", { name: "تقييد" })).toBeVisible();

    await applicantPage.reload();
    await expect(applicantPage).toHaveURL(/\/applicant\/dashboard$/);

    const admin = await db.query.admins.findFirst({ where: eq(admins.userId, adminUser.id) });
    const auditEntries = admin
      ? await db.select().from(adminAuditLog).where(and(
          eq(adminAuditLog.adminId, admin.id),
          eq(adminAuditLog.targetId, applicant.id),
          inArray(adminAuditLog.action, ["user_restricted", "user_reenabled"]),
        ))
      : [];
    expect(auditEntries.map((entry) => entry.action).sort()).toEqual(["user_reenabled", "user_restricted"]);
  } finally {
    await Promise.allSettled([adminContext.close(), applicantContext.close()]);
    await retryDatabaseOperation(() => db.update(users)
      .set({ isActive: false, isRestricted: false })
      .where(inArray(users.id, [adminUser.id, applicant.id])));
  }
});
