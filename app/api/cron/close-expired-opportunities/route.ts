import { NextResponse } from "next/server";
import { and, lt, eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { closePendingApplications } from "@/features/applications/services/status-transitions";

/**
 * يُستدعى دوريًا (كل ساعة) — يضع حالة "منتهية" (expired) لأي فٌرصة تجاوزت
 * applicationDeadline ولا تزال منشورة دون اكتمال المقاعد المطلوبة (راجع
 * وثيقة المتطلبات § 7.2). هذا مختلف عن حالة "مغلقة" (closed) التي تعني تحديدًا
 * اكتمال المقاعد المقبولة أو استبدال الجهة للفٌرصة — راجع lib/constants.ts § OPPORTUNITY_STATUS
 * والتمييز الموثَّق هناك بين closed وexpired.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const now = new Date();

  const expired = await db.transaction(async (tx) => {
    const rows = await tx.select({ id: opportunities.id }).from(opportunities)
      .where(and(eq(opportunities.status, "published"), lt(opportunities.applicationDeadline, now))).for("update");
    for (const opportunity of rows) {
      await tx.update(opportunities).set({ status: "expired", updatedAt: now,
        closedAt: now, closureReason: "application_deadline_passed" })
        .where(eq(opportunities.id, opportunity.id));
      await closePendingApplications(tx, opportunity.id);
    }
    return rows;
  });

  return NextResponse.json({ expiredCount: expired.length });
}
