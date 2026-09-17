"use client";

import * as React from "react";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadDropzoneProps {
  accept: string; // مثال: "application/pdf" أو "image/*"
  maxSizeMb?: number;
  onFileSelected: (file: File | null) => void;
  selectedFile?: File | null;
  label: string;
  helperText?: string;
  compact?: boolean;
}

/**
 * منطقة رفع ملف عامة (Drag & Drop + اختيار يدوي) — تُستخدم لرفع CV، الصور الشخصية،
 * وشعارات الجهات. الرفع الفعلي لـ Supabase Storage يحدث في المكوّن الأب المستدعي
 * (هذا المكوّن مسؤول فقط عن التقاط الملف من المستخدم وعرض معاينة الاسم/الحجم).
 */
export function FileUploadDropzone({
  accept,
  maxSizeMb = 5,
  onFileSelected,
  selectedFile,
  label,
  helperText,
  compact = false,
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputId = React.useId();

  function validateAndSet(file: File | null) {
    if (!file) {
      onFileSelected(null);
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`حجم الملف أكبر من الحد المسموح (${maxSizeMb} ميجابايت)`);
      return;
    }
    setError(null);
    onFileSelected(file);
  }

  return (
    <div className={cn("flex flex-col gap-2", compact && "items-start")}>
      <label className="text-body-sm font-medium text-neutral-700">{label}</label>

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          validateAndSet(e.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-md border px-4 transition-colors duration-fast",
          compact
            ? "min-h-10 w-fit max-w-full flex-row border-solid bg-surface py-2 text-start shadow-xs"
            : "w-full flex-col border-dashed py-8 text-center",
          isDragging ? "border-primary-500 bg-primary-50" : "border-neutral-300 hover:border-primary-400 hover:bg-primary-50/50"
        )}
      >
        {selectedFile ? (
          <>
            <FileText className={cn("shrink-0 text-primary-600", compact ? "h-5 w-5" : "h-6 w-6")} />
            <span className="min-w-0 flex-1 truncate text-body-sm text-neutral-700">{selectedFile.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                validateAndSet(null);
              }}
              className={cn("flex shrink-0 items-center gap-1 text-caption text-danger-500", !compact && "mt-1")}
            >
              <X className="h-3 w-3" /> إزالة
            </button>
          </>
        ) : (
          <>
            <Upload className={cn("shrink-0 text-neutral-400", compact ? "h-5 w-5" : "h-6 w-6")} />
            <span className="text-body-sm text-secondary">{compact ? "اختيار صورة" : "اختر ملفًا أو اسحبه هنا"}</span>
          </>
        )}
      </label>

      <input
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
      />

      {error && <p className="text-caption text-danger-500">{error}</p>}
      {helperText && !error && <p className="text-caption text-neutral-400">{helperText}</p>}
    </div>
  );
}
