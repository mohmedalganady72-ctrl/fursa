import type { notificationTypeEnum } from "@/lib/db/schema/notifications";

export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

/** مدخل إنشاء إشعار — يُستخدم من كل الميزات الأخرى (applications, opportunities, admin...) */
export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  /** إن كانت true، يُرسَل بريد إلكتروني بالتوازي مع الإشعار داخل النظام */
  sendEmail?: boolean;
}
