"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { OpportunityType } from "@/lib/constants";

interface ApplicationFormProps {
  opportunityId: string;
  opportunityType: OpportunityType;
  requiresResume: boolean; // ذو صلة لفٌرص التطوع تحديدًا (راجع وثيقة المتطلبات § 10.3)
}

/**
 * نموذج التقديم الموحّد — يعرض حقولًا مختلفة حسب نوع الفٌرصة (راجع وثيقة المتطلبات § 10.3):
 * عمل: "لماذا أنت مناسب؟" + CV إجباري
 * تطوع: CV اختياري (حسب طلب الجهة)
 * تدريب تعاوني: الرقم الأكاديمي، المستوى الدراسي، الجامعة، التخصص
 * بيانات الملف الشخصي الأساسية (اسم، مدينة...) لا تُعاد تعبئتها هنا أبدًا —
 * تُؤخذ تلقائيًا من applicant_profiles في الخادم عند الإرسال.
 */
export function ApplicationForm({ opportunityId, opportunityType, requiresResume }: ApplicationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resumeFile, setResumeFile] = React.useState<File | null>(null);

  const [whySuitableText, setWhySuitableText] = React.useState("");
  const [academicId, setAcademicId] = React.useState("");
  const [academicLevel, setAcademicLevel] = React.useState("");
  const [university, setUniversity] = React.useState("");
  const [major, setMajor] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let resumeUrl: string | undefined;
      if (resumeFile) {
        const upload = new FormData();
        upload.set("kind", "resume");
        upload.set("file", resumeFile);
        const uploadResponse = await fetch("/api/uploads", { method: "POST", body: upload });
        const uploadResult = await uploadResponse.json().catch(() => ({ message: "تعذّر قراءة استجابة الخادم. حاول مرة أخرى." }));
        if (!uploadResponse.ok) {
          toast({ variant: "error", title: "تعذّر رفع السيرة الذاتية", description: uploadResult.message ?? uploadResult.error });
          return;
        }
        resumeUrl = uploadResult.data.path;
      }
      const body =
        opportunityType === "job"
          ? { opportunityType, opportunityId, whySuitableText, resumeUrl }
          : opportunityType === "co_op"
            ? { opportunityType, opportunityId, academicId, academicLevel, university, major }
            : { opportunityType, opportunityId, resumeUrl };

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json().catch(() => ({ message: "تعذّر قراءة استجابة الخادم. حاول مرة أخرى." }));

      if (!response.ok) {
        toast({ variant: "error", title: "تعذّر إرسال الطلب", description: result.message ?? result.error });
        return;
      }

      toast({ variant: "success", title: "أُرسل طلبك بنجاح" });
      router.push("/applicant/applications");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {opportunityType === "job" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="whySuitable">لماذا أنت مناسب لهذه الوظيفة؟</Label>
          <Textarea
            id="whySuitable"
            value={whySuitableText}
            onChange={(e) => setWhySuitableText(e.target.value)}
            placeholder="اشرح اهتمامك بهذه الفٌرصة وما يمكنك تقديمه، من دون تكرار محتوى سيرتك الذاتية."
            required
            minLength={30}
            className="min-h-32"
          />
        </div>
      )}

      {opportunityType === "co_op" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="academicId">الرقم الأكاديمي</Label>
              <Input id="academicId" value={academicId} onChange={(e) => setAcademicId(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="academicLevel">المستوى الدراسي</Label>
              <Input id="academicLevel" value={academicLevel} onChange={(e) => setAcademicLevel(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="university">الجامعة</Label>
              <Input id="university" value={university} onChange={(e) => setUniversity(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="major">التخصص</Label>
              <Input id="major" value={major} onChange={(e) => setMajor(e.target.value)} required />
            </div>
          </div>
        </>
      )}

      {(opportunityType === "job" || (opportunityType === "volunteering" && requiresResume)) && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="resume">
            السيرة الذاتية (PDF) {opportunityType === "volunteering" && "— مطلوبة لهذه الفٌرصة"}
          </Label>
          <label
            htmlFor="resume"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/50"
          >
            {resumeFile ? (
              <>
                <FileText className="h-6 w-6 text-primary-600" />
                <span className="text-body-sm text-neutral-700">{resumeFile.name}</span>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-neutral-400" />
                <span className="text-body-sm text-secondary">اختر ملفًا بصيغة PDF</span>
              </>
            )}
          </label>
          <input
            id="resume"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            required={opportunityType === "job"}
          />
        </div>
      )}

      <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">
        إرسال الطلب
      </Button>
    </form>
  );
}
