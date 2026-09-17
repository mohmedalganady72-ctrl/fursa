import { test, expect } from "@playwright/test";
import { and, eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { applications, opportunities, conversations, applicationStatusHistory } from "../../lib/db/schema";
import { lifecycleFixture, login, retireFixture } from "./fixtures";
import { acceptApplicant, rejectApplicant } from "../../features/applications/services/acceptance-lifecycle";
import { closeOpportunityAndCreateReplacement } from "../../features/opportunities/services/opportunities.service";
import { listConversationMessages, sendMessage } from "../../features/messaging/services/messages.service";

test.setTimeout(180000);
test("ownership, atomic last-seat acceptance, immutable final decisions and replacement rollback", async ({ page }) => {
  const fixture = await lifecycleFixture();
  const first = fixture.applications[0]!;
  const second = fixture.applications[1]!;
  try {
    await login(page, fixture.outsider);
    const response = await page.request.patch(`/api/applications/${first.id}/decision`, { data: { decision: "accept" } });
    expect(response.status()).toBe(403);
    await page.goto(`/organization/opportunities/${fixture.opportunity.id}/applicants`);
    await expect(page.getByRole("heading", { name: "٤٠٤" })).toBeVisible();
    await expect(acceptApplicant(first.id, fixture.outsider.id)).rejects.toThrow("FORBIDDEN");
    const input = { type: "volunteering" as const, title: "QA replacement", description: "Transactional replacement verification.",
      city: "الرياض", workMode: "remote" as const, seatsAvailable: 1, applicationDeadline: new Date(Date.now() + 86400000),
      fieldIds: ["00000000-0000-4000-8000-000000000001"], requiresResume: false, genderRequirement: null };
    await expect(closeOpportunityAndCreateReplacement(fixture.opportunity.id, fixture.owner.profileId, input)).rejects.toThrow();
    expect((await db.query.opportunities.findFirst({ where: eq(opportunities.id, fixture.opportunity.id) }))?.status).toBe("published");
    expect((await db.query.applications.findFirst({ where: eq(applications.id, first.id) }))?.status).toBe("applied");
    const decisions = await Promise.allSettled([
      acceptApplicant(first.id, fixture.owner.id), acceptApplicant(second.id, fixture.owner.id),
      acceptApplicant(first.id, fixture.owner.id),
    ]);
    expect(decisions.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const updated = await db.query.opportunities.findFirst({ where: eq(opportunities.id, fixture.opportunity.id) });
    expect(updated).toMatchObject({ status: "closed", seatsFilled: 1 });
    const rows = await db.query.applications.findMany({ where: eq(applications.opportunityId, fixture.opportunity.id) });
    expect(rows.map((row) => row.status).sort()).toEqual(["accepted", "closed"]);
    const accepted = rows.find((row) => row.status === "accepted")!;
    const conversation = await db.query.conversations.findFirst({ where: eq(conversations.applicationId, accepted.id) });
    expect(conversation).toBeTruthy();
    expect((await page.request.get(`/api/messages/${conversation!.id}`)).status()).toBe(403);
    await expect(sendMessage({ conversationId: conversation!.id, senderId: fixture.outsider.id, content: "غير مصرح" }))
      .rejects.toThrow("FORBIDDEN");
    const candidate = fixture.candidates.find((item) => item.profileId === accepted.applicantProfileId)!;
    await sendMessage({ conversationId: conversation!.id, senderId: fixture.owner.id, content: "مرحبًا بالمتقدم المقبول" });
    expect(await listConversationMessages(conversation!.id, candidate.id)).toHaveLength(1);
    expect(await db.query.applicationStatusHistory.findFirst({ where: and(eq(applicationStatusHistory.applicationId, accepted.id), eq(applicationStatusHistory.newStatus, "accepted")) })).toBeTruthy();
    await expect(rejectApplicant(accepted.id, fixture.owner.id)).rejects.toThrow("INVALID_STATUS_TRANSITION");
  } finally { await retireFixture(fixture); }
});
