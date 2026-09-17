import { NextResponse } from "next/server";
import { getOpportunityById } from "@/features/opportunities/services/opportunities.service";

/** GET /api/opportunities/:id — تفاصيل فرصة واحدة (عام) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const { opportunityId } = await params;
  const opportunity = await getOpportunityById(opportunityId);

  if (!opportunity) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ data: opportunity });
}

// لا يوجد PATCH هنا — الفرص لا تُعدَّل بعد النشر في هذا الإصدار (راجع وثيقة المتطلبات § 5.7).
// راجع مسار /api/opportunities/[opportunityId]/replace لتدفق "إغلاق + إنشاء بديل".
