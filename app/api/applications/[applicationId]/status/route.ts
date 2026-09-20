import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireApiSession } from "@/lib/auth/api-session";
import { db } from "@/lib/db";
import { applications, applicantProfiles } from "@/lib/db/schema";

/**
 * GET /api/applications/:id/status
 * فحص سريع لحالة تقديم واحد — يُستخدم من واجهة "تقديماتي" لتحديث الحالة
 * دون إعادة تحميل الصفحة كاملة (polling خفيف أو تحديث عند التركيز على النافذة).
 * الوصول مقيَّد لصاحب التقديم فقط.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { applicationId } = await params;
  const session = await requireApiSession();
  if (session instanceof Response) return session;

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
    with: { applicantProfile: true },
  });

  if (!application) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (application.applicantProfile.userId !== session.user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({
    data: {
      status: application.status,
    },
  });
}
