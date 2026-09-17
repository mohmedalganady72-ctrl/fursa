import Link from "next/link";
import { Building2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { listAllOrganizations } from "@/features/admin/services/admin.service";
import { AdminSearch } from "@/features/admin/components/admin-search";

/** قائمة كل الجهات (معتمدة وغير معتمدة) — راجع حالات الاستخدام § "عرض المستخدمين الجهات" */
export default async function AdminOrganizationsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim() ?? "";
  const organizations = await listAllOrganizations(query);

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">الجهات</h1>
      <p className="mt-1 text-body text-secondary">{organizations.length} جهة مسجَّلة</p>
      <AdminSearch defaultValue={query} placeholder="ابحث باسم الجهة أو المدينة أو البريد" />

      {organizations.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Building2} title="لا توجد جهات مسجَّلة بعد" />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {organizations.map((org) => (
            <Card key={org.id} className="flex items-center gap-3 p-4">
              <Avatar>
                <AvatarImage src={org.logoUrl ?? undefined} />
                <AvatarFallback>{org.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-body-sm font-semibold text-neutral-800">{org.name}</p>
                <p className="text-caption text-secondary">{org.user.email} · {org.city}</p>
              </div>
              <Badge variant={org.isApproved ? "success" : "warning"}>
                {org.isApproved ? "معتمدة" : "قيد المراجعة"}
              </Badge>
              <Link href={`/admin/organizations/${org.id}`} aria-label={`عرض ملف ${org.name}`} title="عرض الملف" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-primary-50 hover:text-primary-700"><Eye className="h-4 w-4" /></Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
