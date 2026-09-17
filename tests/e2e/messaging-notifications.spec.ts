import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { conversations, notifications } from "../../lib/db/schema";
import { acceptApplicant } from "../../features/applications/services/acceptance-lifecycle";
import { lifecycleFixture, login, retireFixture } from "./fixtures";

test("إرسال رسالة ينشئ إشعاراً ويُعلّم عند فتح المحادثة", async ({ browser }) => {
  test.setTimeout(180_000);
  const fixture = await lifecycleFixture(2);
  const applicant = fixture.candidates[0];
  const application = fixture.applications[0];
  if (!applicant || !application) throw new Error("FIXTURE_FAILED");
  const applicantContext = await browser.newContext();
  const organizationContext = await browser.newContext();
  try {
    await acceptApplicant(application.id, fixture.owner.id);
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.applicationId, application.id),
    });
    expect(conversation).toBeTruthy();

    const applicantPage = await applicantContext.newPage();
    await login(applicantPage, applicant);
    await applicantPage.goto(`/applicant/messages/${conversation!.id}`);
    const composer = applicantPage.getByPlaceholder("اكتب رسالتك...");
    await composer.waitFor({ state: "visible" });
    await applicantPage.waitForTimeout(750);
    await composer.fill("رسالة اختبار المحادثة");
    await Promise.all([
      applicantPage.waitForResponse((response) => response.url().includes(`/api/messages/${conversation!.id}`) && response.request().method() === "POST"),
      applicantPage.getByRole("button", { name: "إرسال" }).click(),
    ]);
    await expect(applicantPage.getByText("رسالة اختبار المحادثة")).toBeVisible();

    const createdNotification = await db.query.notifications.findFirst({
      where: (item, { and, eq }) => and(eq(item.userId, fixture.owner.id), eq(item.type, "new_message")),
    });
    expect(createdNotification?.isRead).toBe(false);

    const organizationPage = await organizationContext.newPage();
    await login(organizationPage, fixture.owner);
    await organizationPage.goto("/organization/notifications");
    await expect(organizationPage.getByText("رسالة اختبار المحادثة")).toBeVisible();
    await organizationPage.getByText("رسالة اختبار المحادثة").click();
    await expect(organizationPage).toHaveURL(new RegExp(`/organization/messages/${conversation!.id}$`));
    await expect(organizationPage.getByText("رسالة اختبار المحادثة")).toBeVisible();

    const readNotification = await db.query.notifications.findFirst({
      where: eq(notifications.id, createdNotification!.id),
    });
    expect(readNotification?.isRead).toBe(true);
  } finally {
    await Promise.allSettled([applicantContext.close(), organizationContext.close()]);
    await retireFixture(fixture);
  }
});
