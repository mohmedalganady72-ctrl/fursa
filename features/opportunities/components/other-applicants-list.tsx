import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface OtherApplicantsListProps {
  applicants: Array<{ id: string; fullName: string; avatarUrl: string | null }>;
}

/**
 * قائمة المتقدمين الآخرين على نفس الفرصة — الاسم والصورة فقط، بدون أي رابط لفتح ملفاتهم
 * الشخصية (راجع وثيقة المتطلبات § "لا يستطيع المتقدم فتح ملف البروفايل لمتقدم آخر").
 * لهذا السبب تحديدًا هذه العناصر <div> عادية وليست <Link> — القرار مقصود لمنع أي محاولة
 * توسّع مستقبلية بالخطأ لإضافة رابط تفاصيل هنا.
 */
export function OtherApplicantsList({ applicants }: OtherApplicantsListProps) {
  if (applicants.length === 0) return null;

  return (
    <div className="mt-8 border-t border-neutral-200 pt-6">
      <h3 className="text-h4 text-neutral-800">متقدمون آخرون على هذه الفرصة</h3>
      <div className="mt-4 flex flex-wrap gap-4">
        {applicants.map((applicant) => (
          <div key={applicant.id} className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarImage src={applicant.avatarUrl ?? undefined} alt={applicant.fullName} />
              <AvatarFallback>{applicant.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-body-sm text-neutral-600">{applicant.fullName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
