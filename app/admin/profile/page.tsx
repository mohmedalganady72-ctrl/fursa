import { eq } from "drizzle-orm";
import { AdminProfileForm } from "@/features/admin/components/admin-profile-form";
import { requirePageSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { withDatabaseRetry } from "@/lib/db/retry";

export default async function AdminProfilePage() {
  const session = await requirePageSession("/admin-login");
  const admin = await withDatabaseRetry(() => db.query.admins.findFirst({
    columns: { displayName: true },
    where: eq(admins.userId, session.user.id),
  }));

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">حسابي</h1>
      <p className="mt-1 text-body text-secondary">حدّث اسمك وبريدك الإلكتروني المستخدم لتسجيل الدخول.</p>
      <div className="mt-6">
        <AdminProfileForm displayName={admin?.displayName ?? session.user.name ?? "مدير المنصة"} email={session.user.email} />
      </div>
    </div>
  );
}
