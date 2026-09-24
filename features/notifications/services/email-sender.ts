import { sendTransactionalEmail } from "@/lib/nylas";
import { env } from "@/lib/env";

const FROM_ADDRESS = {
  name: "منصّة فٌرص",
  email: env.NYLAS_FROM_EMAIL ?? `notifications@${env.NYLAS_SENDER_DOMAIN}`,
};

/**
 * غلاف (wrapper) رقيق فوق Nylas Transactional Send — نقطة الاستدعاء الوحيدة لإرسال بريد في كل المشروع.
 * كل قالب بريد يُبنى كدالة منفصلة هنا بدل تكرار HTML خام في كل مكان يحتاج إرسال بريد.
 */
export async function sendNotificationEmail(params: {
  to: string;
  subject: string;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
}) {
  const actionButton = params.actionUrl
    ? `<a href="${params.actionUrl}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#4F46E5;color:#fff;border-radius:8px;text-decoration:none;">${params.actionLabel ?? "عرض التفاصيل"}</a>`
    : "";

  await sendTransactionalEmail({
    from: FROM_ADDRESS,
    to: [{ email: params.to }],
    subject: params.subject,
    body: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1E293B;">${params.title}</h2>
        <p style="color: #475569; line-height: 1.6;">${params.body}</p>
        ${actionButton}
      </div>
    `,
  });
}

/** قالب مخصص لرمز التحقق من البريد عند إنشاء الحساب (راجع lib/auth/config.ts) */
export async function sendVerificationCodeEmail(to: string, code: string) {
  await sendTransactionalEmail({
    from: FROM_ADDRESS,
    to: [{ email: to }],
    subject: "رمز التحقق من البريد الإلكتروني",
    body: `
      <div dir="rtl" style="font-family: Arial, sans-serif; text-align: center; padding: 32px;">
        <h2>رمز التحقق الخاص بك</h2>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">${code}</p>
        <p style="color: #64748B;">صالح لمدة 10 دقائق.</p>
      </div>
    `,
  });
}
