import { env } from "@/lib/env";

/**
 * غلاف رقيق فوق Nylas Transactional Send (POST /v3/domains/{domain}/messages/send).
 * نُستخدَم الآن بدل Resend كطبقة الإرسال الوحيدة في المشروع — راجع docs.nylas.com/docs/cookbook/email/transactional-send.
 * نُنفِّذ الطلب عبر fetch مباشرة (وليس حزمة nylas الرسمية) لتفادي تبعية إضافية
 * غير ضرورية لعملية إرسال بسيطة واحدة الاتجاه.
 *
 * ملاحظة: هذه الميزة في مرحلة Beta لدى Nylas وتتطلب دومين مُتحقَّقًا منه مسبقًا
 * في لوحة تحكم Nylas (Organization Settings) قبل أي استخدام فعلي.
 */

interface NylasEmailAddress {
  name?: string;
  email: string;
}

interface SendTransactionalEmailParams {
  to: NylasEmailAddress[];
  from: NylasEmailAddress;
  subject: string;
  body: string; // HTML
}

export class NylasSendError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "NylasSendError";
  }
}

export async function sendTransactionalEmail(params: SendTransactionalEmailParams) {
  const response = await fetch(
    `${env.NYLAS_API_URI}/v3/domains/${env.NYLAS_SENDER_DOMAIN}/messages/send`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.NYLAS_API_KEY}`,
      },
      body: JSON.stringify({
        to: params.to,
        from: params.from,
        subject: params.subject,
        body: params.body,
      }),
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!response.ok) {
    const details = await response.json().catch(() => undefined);
    throw new NylasSendError(
      `فشل إرسال البريد عبر Nylas (${response.status}): ${JSON.stringify(details)}`,
      response.status,
      details
    );
  }

  return response.json();
}
