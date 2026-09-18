"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteSavedSearchButtonProps {
  savedSearchId: string;
}

/** زر حذف بحث محفوظ — يستدعي DELETE /api/saved-searches/:id ثم يُحدّث القائمة */
export function DeleteSavedSearchButton({ savedSearchId }: DeleteSavedSearchButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/saved-searches/${savedSearchId}`, { method: "DELETE" });
      if (!response.ok) {
        setErrorMessage("تعذّر حذف البحث المحفوظ.");
        return;
      }
      router.refresh();
    } catch {
      setErrorMessage("تعذّر حذف البحث المحفوظ. تحقق من اتصالك وحاول مرة أخرى.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <span className="relative inline-flex">
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label="حذف البحث المحفوظ"
      className="text-neutral-400 hover:bg-danger-50 hover:text-danger-500"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </Button>
    {errorMessage ? <span role="alert" className="absolute end-0 top-full z-20 mt-1 w-48 rounded-md border border-danger-500/25 bg-danger-50 px-2 py-1.5 text-start text-caption text-danger-500 shadow-md">{errorMessage}</span> : null}
    </span>
  );
}
