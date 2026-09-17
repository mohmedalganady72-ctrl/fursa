"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import type { OrganizationProfile } from "@/lib/db/schema";
import { FileUploadDropzone } from "@/components/shared/file-upload-dropzone";
import { clearPostProfileRedirect } from "@/lib/firebase/auth-flow";

const ORG_TYPE_OPTIONS = [
  { value: "company", label: "شركة" },
  { value: "nonprofit", label: "منظمة غير ربحية" },
  { value: "academic", label: "مؤسسة أكاديمية" },
  { value: "government", label: "جهة حكومية" },
];

export function OrganizationProfileForm({ initialProfile }: { initialProfile?: Partial<OrganizationProfile> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [name, setName] = React.useState(initialProfile?.name ?? "");
  const [organizationType, setOrganizationType] = React.useState(initialProfile?.organizationType ?? "");
  const [city, setCity] = React.useState(initialProfile?.city ?? "");
  const [activityDescription, setActivityDescription] = React.useState(initialProfile?.activityDescription ?? "");
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | undefined>(initialProfile?.logoUrl ?? undefined);

  React.useEffect(() => {
    if (!logoFile) { setLogoPreview(initialProfile?.logoUrl ?? undefined); return; }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile, initialProfile?.logoUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let logoUrl = initialProfile?.logoUrl ?? undefined;
      if (logoFile) {
        const upload = new FormData(); upload.set("kind", "logo"); upload.set("file", logoFile);
        const uploadResponse = await fetch("/api/uploads", { method: "POST", body: upload });
        const uploadResult = await uploadResponse.json().catch(() => ({ message: "تعذّر قراءة استجابة الخادم. حاول مرة أخرى." }));
        if (!uploadResponse.ok) {
          toast({ variant: "error", title: "تعذّر رفع الشعار", description: uploadResult.message ?? uploadResult.error });
          return;
        }
        logoUrl = uploadResult.data.url;
      }
      const response = await fetch("/api/organization/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, organizationType, city, activityDescription, logoUrl }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({ message: "تعذّر قراءة استجابة الخادم. حاول مرة أخرى." }));
        toast({ variant: "error", title: "تعذّر حفظ الملف", description: result.message });
        return;
      }

      toast({ variant: "success", title: "تم حفظ ملف الجهة" });
      clearPostProfileRedirect();
      sessionStorage.removeItem("fursa-post-profile-redirect");
      router.push("/organization/dashboard");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {/*
          صورة: شعار الجهة
          المقاس المقترح: يُخزَّن 128×128px، يُعرَض هنا 80×80px
          الصيغة: PNG شفاف أو WebP
        */}
        <Avatar size="xl">
          <AvatarImage src={logoPreview} alt={name} />
          <AvatarFallback>{name.charAt(0) || "؟"}</AvatarFallback>
        </Avatar>
        <div className="flex-1"><FileUploadDropzone accept="image/png,image/jpeg,image/webp" maxSizeMb={5}
          label="شعار الجهة" helperText="PNG أو JPEG أو WebP، حتى 5 ميجابايت" compact
          selectedFile={logoFile} onFileSelected={setLogoFile} /></div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">اسم الجهة</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="organizationType">نوع الجهة</Label>
          <Select value={organizationType} onValueChange={setOrganizationType}>
            <SelectTrigger id="organizationType"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
            <SelectContent>
              {ORG_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">المدينة</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="activityDescription">وصف النشاط</Label>
        <Textarea
          id="activityDescription"
          value={activityDescription}
          onChange={(e) => setActivityDescription(e.target.value)}
          maxLength={1000}
        />
      </div>

      <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">
        حفظ ملف الجهة
      </Button>
    </form>
  );
}
