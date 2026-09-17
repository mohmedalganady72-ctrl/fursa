import { NextResponse } from "next/server";

/**
 * Webhook استقبال أحداث تسليم البريد من Nylas Transactional Send
 * (message.transactional.bounced/complaint/delivered/rejected — راجع
 * developer.nylas.com/docs/reference/notifications/transactional-email).
 * الحمولة بصيغة CloudEvents: النوع في event.type، والتفاصيل في event.data.object.
 * يُستخدم حاليًا للتسجيل التشخيصي فقط (Logging)؛ لا يُتَّخذ أي إجراء تلقائي
 * (مثل تعطيل بريد مرتد) في هذا الإصدار الأساسي — يُضاف لاحقًا عند الحاجة الفعلية.
 * يجب تسجيل رابط هذا الـ route في لوحة تحكم Nylas يدويًا بعد النشر.
 */
export async function POST(request: Request) {
  const event = await request.json();

  // تسجيل بسيط الآن؛ نسخة إنتاجية تُخزِّن هذه الأحداث في جدول مخصص
  // لمراقبة صحة تسليم البريد بمرور الوقت (معدل الارتداد، الشكاوى...)
  console.log("Nylas webhook event:", event.type, event.data?.object?.message_id ?? event.data?.object);

  return NextResponse.json({ received: true });
}
