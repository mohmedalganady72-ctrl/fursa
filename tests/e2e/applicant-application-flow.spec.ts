import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { opportunities, applications, users } from "../../lib/db/schema";
import { createTestUser, login } from "./fixtures";

test("يستطيع الباحث التقديم على فٌرصة تدريب تعاوني", async ({ page }) => {
  const owner = await createTestUser("organization");
  const applicant = await createTestUser("applicant");
  const [opportunity] = await db.insert(opportunities).values({ organizationProfileId: owner.profileId,
    type: "co_op", title: "تدريب اختبار متكامل", description: "فٌرصة تدريب لاختبار رحلة التقديم الكاملة.",
    city: "الرياض", workMode: "remote", seatsAvailable: 2,
    applicationDeadline: new Date(Date.now() + 86400000), requiredAcademicLevel: "السنة الأخيرة" }).returning();
  try {
    await login(page, applicant);
    await page.goto(`/opportunities/co-op/${opportunity!.id}`);
    await page.getByLabel("الرقم الأكاديمي").fill("441234567");
    await page.getByLabel("المستوى الدراسي").fill("السنة الأخيرة");
    await page.getByLabel("الجامعة").fill("جامعة الملك سعود");
    await page.getByLabel("التخصص").fill("علوم الحاسب");
    await page.getByRole("button", { name: "إرسال التقديم" }).click();
    await expect(page).toHaveURL(/\/applicant\/applications/);
    expect(await db.query.applications.findFirst({ where: eq(applications.opportunityId, opportunity!.id) })).toBeTruthy();
  } finally {
    await db.update(opportunities).set({ status: "closed", closedAt: new Date(), closureReason: "qa_completed" }).where(eq(opportunities.id, opportunity!.id));
    await db.update(users).set({ isActive: false }).where(eq(users.id, owner.id));
    await db.update(users).set({ isActive: false }).where(eq(users.id, applicant.id));
  }
});
