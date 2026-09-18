"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUploadDropzone } from "@/components/shared/file-upload-dropzone";
import { OpportunityCard } from "@/components/shared/opportunity-card";
import { EmptyState } from "@/components/shared/empty-state";
import { OpportunityGridSkeleton } from "@/components/shared/loading-skeletons";
import { useToast } from "@/hooks/use-toast";

/**
 * صفحة البحث الذكي — تتيح للباحث رفع سيرته الذاتية ليحلّلها النظام (features/cv-parsing)
 * ثم يعرض الفٌرص الأقرب توافقًا بناءً على البيانات المدمجة (ملف شخصي + CV).
 * راجع وثيقة المتطلبات § "البحث الذكي" للمسارين: بالملف الشخصي فقط، أو + السيرة الذاتية.
 */
export default function SmartSearchPage() {
  const { toast } = useToast();
  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [matchedOpportunities, setMatchedOpportunities] = React.useState<any[] | null>(null);

  async function handleAnalyze() {
    setIsAnalyzing(true);
    try {
      // الخطوات الفعلية: 1) رفع resumeFile لـ Supabase Storage عبر endpoint مخصص
      // 2) استدعاء POST /api/cv/parse بالمسار الناتج (features/cv-parsing)
      // 3) استدعاء GET /api/search/smart بالبيانات المُحلَّلة لجلب الفٌرص المرتّبة
      const response = await fetch("/api/search/smart", { method: "GET" });
      const result = await response.json();
      setMatchedOpportunities(result.data ?? []);
    } catch {
      toast({ variant: "error", title: "تعذّر تحليل السيرة الذاتية", description: "تحقق من الملف وحاول مرة أخرى." });
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary-600" />
        <h1 className="text-h1 text-neutral-900">البحث الذكي</h1>
      </div>
      <p className="mt-1 text-body text-secondary">
        ارفع سيرتك الذاتية ليحلّلها النظام ويعرض لك الفٌرص الأقرب لبياناتك ومهاراتك
      </p>

      <Card className="mt-6 p-6">
        <FileUploadDropzone
          accept="application/pdf"
          maxSizeMb={5}
          selectedFile={resumeFile}
          onFileSelected={setResumeFile}
          label="السيرة الذاتية (PDF)"
          helperText="يمكنك الاعتماد على بيانات ملفك الشخصي من دون رفع سيرة ذاتية."
        />

        <div className="mt-4 flex gap-3">
          <Button onClick={handleAnalyze} isLoading={isAnalyzing} disabled={!resumeFile}>
            تحليل وعرض الفٌرص المناسبة
          </Button>
          <Button variant="outline" onClick={handleAnalyze} isLoading={isAnalyzing}>
            الاعتماد على ملفي الشخصي فقط
          </Button>
        </div>
      </Card>

      <div className="mt-8">
        {isAnalyzing ? (
          <OpportunityGridSkeleton count={3} />
        ) : matchedOpportunities === null ? null : matchedOpportunities.length === 0 ? (
          <EmptyState icon={Sparkles} title="لا توجد فٌرص مناسبة حاليًا" description="حدّث بيانات ملفك الشخصي لتحسين النتائج." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {matchedOpportunities.map((row) => (
              <OpportunityCard key={row.id} {...row} href={`/applicant/opportunities/${row.id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
