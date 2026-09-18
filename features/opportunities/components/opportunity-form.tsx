"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { OPPORTUNITY_TYPES, OPPORTUNITY_TYPE_LABELS, WORK_MODE_LABELS, WORK_MODES } from "@/lib/constants";
import type { OpportunityType } from "@/lib/constants";
import { InlineFeedback } from "@/components/shared/inline-feedback";

interface Field {
  id: string;
  nameAr: string;
}

interface OpportunityFormProps {
  availableFields: Field[];
  /** عند إنشاء بديل لفٌرصة مغلقة: النوع لا يتغيّر، فيُمرَّر ثابتًا ويُعطَّل اختياره */
  lockedType?: OpportunityType;
  /** وجوده يعني أن هذا النموذج سيُغلق الفٌرصة المشار إليها وينشئ فٌرصة جديدة بدلًا منها */
  replacesOpportunityId?: string;
}

/**
 * نموذج إعلان الفٌرصة الموحّد — واجهة واحدة تتغيّر حقولها الإضافية حسب النوع المختار
 * (راجع وثيقة المتطلبات § 5.6). لا يوجد "تعديل" لفٌرصة منشورة في هذا الإصدار
 * (راجع § 5.7) — هذا النموذج إما (أ) ينشئ فٌرصة جديدة تمامًا، أو (ب) عند تمرير
 * replacesOpportunityId يُغلق فٌرصة قائمة وينشئ هذه كبديل لها ضمن معاملة واحدة
 * (راجع features/opportunities/services/opportunities.service.ts § closeOpportunityAndCreateReplacement).
 */
export function OpportunityForm({ availableFields, lockedType, replacesOpportunityId }: OpportunityFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [type, setType] = React.useState<OpportunityType>(lockedType ?? OPPORTUNITY_TYPES.JOB);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [workMode, setWorkMode] = React.useState<string>(WORK_MODES.ON_SITE);
  const [city, setCity] = React.useState("");
  const [seatsAvailable, setSeatsAvailable] = React.useState(1);
  const [applicationDeadline, setApplicationDeadline] = React.useState("");
  const [selectedFieldIds, setSelectedFieldIds] = React.useState<string[]>([]);

  // حقول خاصة بفٌرص العمل
  const [requiredQualification, setRequiredQualification] = React.useState("");
  const [requiredSkillsText, setRequiredSkillsText] = React.useState("");
  const [minimumYearsExperience, setMinimumYearsExperience] = React.useState<number | "">("");

  // حقول خاصة بالتطوع
  const [requiresResume, setRequiresResume] = React.useState(false);
  const [genderRequirement, setGenderRequirement] = React.useState<string>("");

  // حقول خاصة بالتدريب التعاوني
  const [requiredAcademicLevel, setRequiredAcademicLevel] = React.useState("");
  const [requiredUniversity, setRequiredUniversity] = React.useState("");

  function toggleField(fieldId: string) {
    setSelectedFieldIds((current) =>
      current.includes(fieldId) ? current.filter((id) => id !== fieldId) : [...current, fieldId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const basePayload = {
      type,
      title,
      description,
      workMode,
      city,
      seatsAvailable,
      applicationDeadline,
      fieldIds: selectedFieldIds,
    };

    const typeSpecificPayload =
      type === "job"
        ? {
            requiredQualification,
            requiredSkills: requiredSkillsText.split(",").map((s) => s.trim()).filter(Boolean),
            minimumYearsExperience: minimumYearsExperience === "" ? null : Number(minimumYearsExperience),
          }
        : type === "volunteering"
          ? { requiresResume, genderRequirement: genderRequirement || null }
          : { requiredAcademicLevel, requiredUniversity: requiredUniversity || null };

    try {
      const response = await fetch(
        replacesOpportunityId
          ? `/api/opportunities/${replacesOpportunityId}/replace`
          : "/api/opportunities",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basePayload, ...typeSpecificPayload }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const message =
          result.error === "OPPORTUNITY_ALREADY_CLOSED"
            ? "هذه الفٌرصة مغلقة بالفعل ولا يمكن استبدالها"
            : result.message ?? "تحقق من البيانات المدخلة";
        setFormError(message);
        return;
      }

      toast({
        variant: "success",
        title: replacesOpportunityId ? "أُغلقت الفٌرصة السابقة ونُشرت البديلة" : "نُشرت الفٌرصة بنجاح",
      });
      router.push("/organization/opportunities");
      router.refresh();
    } catch {
      setFormError("تعذّر حفظ الفٌرصة. تحقق من اتصالك، ثم حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {!lockedType && (
        <div className="flex flex-col gap-2">
          <Label>نوع الفٌرصة</Label>
          <div className="flex gap-2">
            {Object.values(OPPORTUNITY_TYPES).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-md border px-4 py-2 text-body-sm font-medium transition-colors ${
                  type === t
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {OPPORTUNITY_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">عنوان الفٌرصة</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={5} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">وصف الفٌرصة</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={20}
          className="min-h-32"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="workMode">نمط العمل</Label>
          <Select value={workMode} onValueChange={setWorkMode}>
            <SelectTrigger id="workMode"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">المدينة</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="seats">عدد المقاعد</Label>
          <Input
            id="seats"
            type="number"
            min={1}
            value={seatsAvailable}
            onChange={(e) => setSeatsAvailable(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:w-64">
        <Label htmlFor="deadline">آخر موعد للتقديم</Label>
        <Input
          id="deadline"
          type="date"
          value={applicationDeadline}
          onChange={(e) => setApplicationDeadline(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>المجالات المطلوبة</Label>
        <div className="flex flex-wrap gap-2">
          {availableFields.map((field) => {
            const isSelected = selectedFieldIds.includes(field.id);
            return (
              <button
                key={field.id}
                type="button"
                onClick={() => toggleField(field.id)}
                className={`rounded-full border px-3 py-1.5 text-body-sm transition-colors ${
                  isSelected
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {field.nameAr}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== حقول خاصة بفٌرص العمل ===== */}
      {type === "job" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="qualification">المؤهل المطلوب</Label>
              <Input id="qualification" value={requiredQualification} onChange={(e) => setRequiredQualification(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="minExperience">الحد الأدنى لسنوات الخبرة (اختياري)</Label>
              <Input
                id="minExperience"
                type="number"
                min={0}
                value={minimumYearsExperience}
                onChange={(e) => setMinimumYearsExperience(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="skills">المهارات المطلوبة (مفصولة بفواصل)</Label>
            <Input
              id="skills"
              value={requiredSkillsText}
              onChange={(e) => setRequiredSkillsText(e.target.value)}
              placeholder="مثال: React, TypeScript, إدارة الوقت"
              required
            />
          </div>
        </>
      )}

      {/* ===== حقول خاصة بالتطوع ===== */}
      {type === "volunteering" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Checkbox id="requiresResume" checked={requiresResume} onCheckedChange={(v) => setRequiresResume(!!v)} />
            <Label htmlFor="requiresResume">يتطلب إرفاق سيرة ذاتية عند التقديم</Label>
          </div>
          <div className="flex flex-col gap-2 sm:w-48">
            <Label htmlFor="genderReq">الفئة المطلوبة (اختياري)</Label>
            <Select value={genderRequirement} onValueChange={setGenderRequirement}>
              <SelectTrigger id="genderReq"><SelectValue placeholder="بلا شرط" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">ذكور فقط</SelectItem>
                <SelectItem value="female">إناث فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* ===== حقول خاصة بالتدريب التعاوني ===== */}
      {type === "co_op" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="academicLevel">المستوى الدراسي المطلوب</Label>
            <Input id="academicLevel" value={requiredAcademicLevel} onChange={(e) => setRequiredAcademicLevel(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="university">الجامعة المطلوبة (اختياري)</Label>
            <Input id="university" value={requiredUniversity} onChange={(e) => setRequiredUniversity(e.target.value)} placeholder="اتركه فارغًا لقبول أي جامعة" />
          </div>
        </div>
      )}

      {formError ? <InlineFeedback title="تعذّر حفظ الفٌرصة" message={formError} /> : null}
      <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">
        {replacesOpportunityId ? "إغلاق الفٌرصة السابقة ونشر البديلة" : "نشر الفٌرصة"}
      </Button>
    </form>
  );
}
