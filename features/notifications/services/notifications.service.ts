import { eq, and, desc, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { sendNotificationEmail } from "./email-sender";
import type { CreateNotificationInput } from "../types";

/**
 * نقطة الإنشاء الموحّدة لكل إشعار في المشروع — أي ميزة تحتاج إخطار مستخدم
 * (تقديم جديد، تغيّر حالة، رسالة دردشة...) تستدعي هذه الدالة بدل إدراج مباشر
 * في جدول notifications، لضمان تطبيق منطق البريد المصاحب باتساق دائمًا.
 */
export async function createNotification(input: CreateNotificationInput) {
  const [created] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl,
    })
    .returning();

  if (!created) throw new Error("NOTIFICATION_CREATE_FAILED");

  if (input.sendEmail) {
    const user = await db.query.users.findFirst({ where: eq(users.id, input.userId) });
    if (user) {
      // لا نُفشل إنشاء الإشعار بسبب خطأ في إرسال البريد — الإشعار داخل النظام أولوية أعلى
      await sendNotificationEmail({
        to: user.email,
        subject: input.title,
        title: input.title,
        body: input.body,
        actionUrl: input.linkUrl,
      }).catch((error) => {
        console.warn("[notifications] تعذّر إرسال البريد، وبقي الإشعار داخل المنصة محفوظًا:",
          error instanceof Error ? error.message : "UNKNOWN_EMAIL_ERROR");
      });
    }
  }

  return created;
}

/** قائمة إشعارات مستخدم معيّن (لصفحة الإشعارات الخاصة به) */
export async function listUserNotifications(userId: string, unreadOnly = false) {
  return db.query.notifications.findMany({
    where: unreadOnly
      ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      : eq(notifications.userId, userId),
    orderBy: desc(notifications.createdAt),
    limit: 50,
  });
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning();

  return updated;
}

export async function markAllNotificationsAsRead(userId: string) {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: string) {
  const [result] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result?.value ?? 0;
}
