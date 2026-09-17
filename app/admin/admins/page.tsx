import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { listAllAdmins } from "@/features/admin/services/admin.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateArabic } from "@/lib/utils";

export default async function AdminsPage() {
  const adminAccounts = await listAllAdmins();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h1 text-neutral-900">مديرو المنصة</h1>
          <p className="mt-1 text-body text-secondary">{adminAccounts.length} حساب إداري</p>
        </div>
        <Button asChild><Link href="/admin/admins/new"><Plus className="h-4 w-4" />إضافة مدير</Link></Button>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {adminAccounts.map((admin) => (
          <Card key={admin.id} className="flex items-center gap-3 p-4">
            <Avatar>
              <AvatarImage src={admin.user.image ?? undefined} alt={admin.displayName} />
              <AvatarFallback>{admin.displayName.trim().charAt(0) || "م"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-body-sm font-semibold text-neutral-800">{admin.displayName}</p>
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary-600" aria-label="مدير معتمد" />
              </div>
              <p className="truncate text-caption text-secondary">{admin.user.email}</p>
            </div>
            <p className="hidden text-caption text-neutral-400 sm:block">أضيف في {formatDateArabic(admin.createdAt)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
