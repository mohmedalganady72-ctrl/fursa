import { NextResponse } from "next/server";
import { and, lt, isNotNull, eq, or, isNull } from "drizzle-orm";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createNotification } from "@/features/notifications/services/notifications.service";
import { INACTIVITY_NUDGE_THRESHOLD_DAYS, USER_ROLES } from "@/lib/constants";

/**
 * يُستدعى يوميًا عبر pg_cron — يرسل رسالة تحفيزية لكل باحث لم يدخل المنصة
 * منذ 3 أيام أو أكثر (راجع وثيقة المتطلبات § "الإشعارات الذكية").
 * لا يُرسَل أكثر من مرة لنفس المستخدم بفارق أقل من يوم، بفضل شرط lastLoginAt
 * الذي يُحدَّث فقط عند تسجيل الدخول الفعلي — إعادة تشغيل هذه المهمة يوميًا كافية وآمنة.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - INACTIVITY_NUDGE_THRESHOLD_DAYS);

  const inactiveApplicants = await db.query.users.findMany({
    where: and(
      eq(users.role, USER_ROLES.APPLICANT),
      isNotNull(users.lastLoginAt),
      lt(users.lastLoginAt, thresholdDate),
      eq(users.inactivityNotificationsEnabled, true),
      or(isNull(users.lastInactivityNudgeAt), lt(users.lastInactivityNudgeAt, thresholdDate))
    ),
  });

  for (const user of inactiveApplicants) {
    await createNotification({
      userId: user.id,
      type: "inactivity_nudge",
      title: "فرص جديدة بانتظارك",
      body: "لم تدخل المنصة منذ عدة أيام — تصفّح الفرص الجديدة التي قد تناسب اهتماماتك",
      linkUrl: "/opportunities/jobs",
      sendEmail: true,
    });
    await db.update(users).set({ lastInactivityNudgeAt: new Date() }).where(eq(users.id, user.id));
  }

  return NextResponse.json({ notifiedCount: inactiveApplicants.length });
}
