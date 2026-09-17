"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MAX_APPLICANT_FIELDS } from "@/lib/constants";
import type { ApplicantProfile } from "@/lib/db/schema";
import { FileUploadDropzone } from "@/components/shared/file-upload-dropzone";

interface Field {
  id: string;
  nameAr: string;
}

interface ProfileFormProps {
  initialProfile?: Partial<ApplicantProfile>;
  availableFields: Field[];
  selectedFieldIds?: string[];
}

const QUALIFICATION_OPTIONS = [
  "أقل من الثانوية",
  "الثانوية العامة",
  "دبلوم",
  "بكالوريوس",
  "ماجستير",
  "دكتوراه",
] as const;

/**
 * نموذج الملف الشخصي — يُستخدم لكل من الإنشاء الأول (بعد التحقق من البريد)
 * والتعديل اللاحق من app/(applicant)/profile. المجالات محدودة بـ5 كحد أقصى،
 * تُفرَض هذه القاعدة بصريًا هنا (تعطيل الاختيار عند بلوغ الحد) وأيضًا في Zod schema.
 */
export function ProfileForm({ initialProfile, availableFields, selectedFieldIds = [] }: ProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedFields, setSelectedFields] = React.useState<string[]>(selectedFieldIds);
  const [fieldSearch, setFieldSearch] = React.useState("");

  const [fullName, setFullName] = React.useState(initialProfile?.fullName ?? "");
  const [city, setCity] = React.useState(initialProfile?.city ?? "");
  const [bio, setBio] = React.useState(initialProfile?.bio ?? "");
  const [gender, setGender] = React.useState(initialProfile?.gender ?? "");
  const [qualification, setQualification] = React.useState(initialProfile?.qualification ?? "");
  const [specialization, setSpecialization] = React.useState(initialProfile?.specialization ?? "");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | undefined>(initialProfile?.avatarUrl ?? undefined);

  React.useEffect(() => {
    if (!avatarFile) { setAvatarPreview(initialProfile?.avatarUrl ?? undefined); return; }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile, initialProfile?.avatarUrl]);

  const selectedFieldItems = selectedFields
    .map((fieldId) => availableFields.find((field) => field.id === fieldId))
    .filter((field): field is Field => Boolean(field));
  const normalizedFieldSearch = fieldSearch.trim().toLocaleLowerCase("ar");
  const filteredFields = availableFields.filter((field) =>
    field.nameAr.toLocaleLowerCase("ar").includes(normalizedFieldSearch)
  );
  const hasLegacyQualification = Boolean(
    qualification && !QUALIFICATION_OPTIONS.some((option) => option === qualification)
  );

  function toggleField(fieldId: string) {
    setSelectedFields((current) => {
      if (current.includes(fieldId)) return current.filter((id) => id !== fieldId);
      if (current.length >= MAX_APPLICANT_FIELDS) {
        toast({ variant: "info", title: `يمكن اختيار ${MAX_APPLICANT_FIELDS} مجالات كحد أقصى` });
        return current;
      }
      return [...current, fieldId];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let avatarUrl = initialProfile?.avatarUrl ?? undefined;
      if (avatarFile) {
        const upload = new FormData(); upload.set("kind", "avatar"); upload.set("file", avatarFile);
        const uploadResponse = await fetch("/api/uploads", { method: "POST", body: upload });
        const uploadResult = await uploadResponse.json().catch(() => ({ message: "تعذّر قراءة استجابة الخادم. حاول مرة أخرى." }));
        if (!uploadResponse.ok) {
          toast({ variant: "error", title: "تعذّر رفع الصورة", description: uploadResult.message ?? uploadResult.error });
          return;
        }
        avatarUrl = uploadResult.data.url;
      }
      const response = await fetch("/api/applicant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          city,
          bio,
          gender: gender || undefined,
          qualification,
          specialization,
          avatarUrl,
          fieldIds: selectedFields,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({ message: "تعذّر قراءة استجابة الخادم. حاول مرة أخرى." }));
        toast({ variant: "error", title: "تعذّر حفظ الملف الشخصي", description: result.message });
        return;
      }

      toast({ variant: "success", title: "تم حفظ ملفك الشخصي" });
      const sharedOpportunityPath = !initialProfile?.id ? sessionStorage.getItem("fursa-post-profile-redirect") : null;
      sessionStorage.removeItem("fursa-post-profile-redirect");
      router.push(sharedOpportunityPath?.startsWith("/applicant/opportunities/") ? sharedOpportunityPath : "/applicant/dashboard");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {/*
          صورة: الصورة الشخصية للباحث
          المقاس المقترح: يُخزَّن 96×96px، يُعرَض هنا 80×80px
          الصيغة: WebP أو JPEG، مربعة 1:1
          ملاحظة: رفع فعلي عبر مكوّن FileUploadDropzone (يُبنى في مرحلة لاحقة)؛
          هنا نعرض فقط المعاينة الحالية إن وُجدت
        */}
        <Avatar size="xl">
          <AvatarImage src={avatarPreview} alt={fullName} />
          <AvatarFallback>{fullName.charAt(0) || "؟"}</AvatarFallback>
        </Avatar>
        <div className="flex-1"><FileUploadDropzone accept="image/png,image/jpeg,image/webp" maxSizeMb={5}
          label="الصورة الشخصية" helperText="PNG أو JPEG أو WebP، حتى 5 ميجابايت" compact
          selectedFile={avatarFile} onFileSelected={setAvatarFile} /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">الاسم الكامل</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">المدينة</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="gender">الجنس</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger id="gender"><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">ذكر</SelectItem>
              <SelectItem value="female">أنثى</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="qualification">المؤهل</Label>
          <Select value={qualification} onValueChange={setQualification}>
            <SelectTrigger id="qualification"><SelectValue placeholder="اختر المؤهل" /></SelectTrigger>
            <SelectContent>
              {hasLegacyQualification ? <SelectItem value={qualification}>{qualification}</SelectItem> : null}
              {QUALIFICATION_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="specialization">التخصص</Label>
        <Input id="specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">نبذة عنك</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Label>المجالات المختارة</Label>
          <span className="text-body-sm text-neutral-500" aria-live="polite">
            {selectedFields.length} / {MAX_APPLICANT_FIELDS}
          </span>
        </div>

        <div className="min-h-14 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          {selectedFieldItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedFieldItems.map((field) => (
                <span
                  key={field.id}
                  className="inline-flex min-h-8 items-center gap-1 rounded-md border border-primary-200 bg-primary-50 ps-3 pe-1 text-body-sm text-primary-700"
                >
                  {field.nameAr}
                  <button
                    type="button"
                    onClick={() => toggleField(field.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-primary-700 hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    aria-label={`حذف مجال ${field.nameAr}`}
                    title={`حذف ${field.nameAr}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-body-sm text-neutral-500">لم تختر أي مجال حتى الآن.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="field-search">ابحث في المجالات</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <Input
              id="field-search"
              type="search"
              value={fieldSearch}
              onChange={(event) => setFieldSearch(event.target.value)}
              className="ps-9"
              placeholder="اكتب اسم المجال"
            />
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto rounded-md border border-neutral-200 p-2">
          {filteredFields.length > 0 ? (
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {filteredFields.map((field) => {
                const isSelected = selectedFields.includes(field.id);
                const isDisabled = !isSelected && selectedFields.length >= MAX_APPLICANT_FIELDS;

                return (
                  <label
                    key={field.id}
                    className={`flex min-h-10 items-center gap-3 rounded-sm px-2 text-body-sm transition-colors ${
                      isDisabled ? "cursor-not-allowed text-neutral-400" : "cursor-pointer hover:bg-neutral-50"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => toggleField(field.id)}
                      aria-label={`اختيار مجال ${field.nameAr}`}
                    />
                    <span>{field.nameAr}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="px-2 py-4 text-center text-body-sm text-neutral-500">لا توجد مجالات مطابقة لعبارة البحث.</p>
          )}
        </div>
      </div>

      <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">
        حفظ الملف الشخصي
      </Button>
    </form>
  );
}
