import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { listAllApplicants } from "@/features/admin/services/admin.service";
import { formatDateArabic } from "@/lib/utils";
import { AdminSearch } from "@/features/admin/components/admin-search";

/** قائمة كل الباحثين عن فٌرصة المسجَّلين في المنصة (راجع حالات الاستخدام § "عرض المستخدمين الباحثين عن فٌرص") */
export default async function AdminApplicantsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim() ?? "";
  const applicants = await listAllApplicants(query);

  return (
    <div>
      <h1 className="text-h1 text-neutral-900">الباحثون عن فٌرص</h1>
      <p className="mt-1 text-body text-secondary">عدد الباحثين المسجّلين: {applicants.length}</p>
      <AdminSearch defaultValue={query} placeholder="ابحث بالاسم أو المدينة أو البريد أو التخصص" />

      {applicants.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Users} title="لا يوجد باحثون مسجّلون حتى الآن" />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {applicants.map((applicant) => (
            <Card key={applicant.id} className="flex items-center gap-3 p-4">
              <Avatar>
                <AvatarImage src={applicant.avatarUrl ?? undefined} />
                <AvatarFallback>{applicant.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-body-sm font-semibold text-neutral-800">{applicant.fullName}</p>
                <p className="text-caption text-secondary">{applicant.user.email} · {applicant.city}</p>
              </div>
              <p className="text-caption text-neutral-400">
                انضم في {formatDateArabic(applicant.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
