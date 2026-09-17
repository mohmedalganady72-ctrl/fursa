import { getServerSession } from "@/lib/auth/session";
import { listUserNotifications } from "@/features/notifications/services/notifications.service";
import { NotificationCenter } from "@/features/notifications/components/notification-center";

export default async function ApplicantNotificationsPage() {
  const session = await getServerSession();
  const notifications = await listUserNotifications(session!.user.id);
  return <NotificationCenter initialNotifications={notifications} />;
}
