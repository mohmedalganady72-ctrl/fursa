"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DeleteSavedSearchButtonProps {
  savedSearchId: string;
}

/** زر حذف بحث محفوظ — يستدعي DELETE /api/saved-searches/:id ثم يُحدّث القائمة */
export function DeleteSavedSearchButton({ savedSearchId }: DeleteSavedSearchButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/saved-searches/${savedSearchId}`, { method: "DELETE" });
      if (!response.ok) {
        toast({ variant: "error", title: "تعذّر حذف البحث المحفوظ" });
        return;
      }
      router.refresh();
    } catch {
      toast({ variant: "error", title: "تعذّر حذف البحث المحفوظ", description: "تحقق من اتصالك وحاول مرة أخرى." });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
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
  );
}
