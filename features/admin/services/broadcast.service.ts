import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, notifications, adminAuditLog } from "@/lib/db/schema";
import { sendNotificationEmail } from "@/features/notifications/services/email-sender";
import { USER_ROLES } from "@/lib/constants";
import type { BroadcastNotificationInput } from "../validators/broadcast.schema";

/**
 * يرسل نفس الإشعار لكل مستخدمي الفئة المحددة. يُستدعى فقط من مدير
 * (التحقق من الصلاحية يحدث في app/api/organizations/[id]/approve/route.ts... إلخ،
 * وهنا في app/(admin)/notifications/broadcast قبل استدعاء هذه الدالة).
 */
export async function broadcastNotification(input: BroadcastNotificationInput, adminId: string) {
  const roles =
    input.audience === "both"
      ? [USER_ROLES.APPLICANT, USER_ROLES.ORGANIZATION]
      : input.audience === "applicants"
        ? [USER_ROLES.APPLICANT]
        : [USER_ROLES.ORGANIZATION];

  const recipients = await db.query.users.findMany({
    where: inArray(users.role, roles),
    columns: { id: true, email: true },
  });

  if (recipients.length > 0) {
    await db.insert(notifications).values(recipients.map((user) => ({
      userId: user.id,
      type: "admin_message" as const,
      title: input.title,
      body: input.body,
    })));
  }

  let emailFailureCount = 0;
  if (input.sendEmail) {
    const BATCH_SIZE = 10;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map((user) => sendNotificationEmail({
        to: user.email,
        subject: input.title,
        title: input.title,
        body: input.body,
      })));
      emailFailureCount += results.filter((result) => result.status === "rejected").length;
    }
  }

  await db.insert(adminAuditLog).values({ adminId, action: "broadcast_sent",
    targetType: "users", metadata: { audience: input.audience, recipientCount: recipients.length } });
  return { recipientCount: recipients.length, emailFailureCount };
}
