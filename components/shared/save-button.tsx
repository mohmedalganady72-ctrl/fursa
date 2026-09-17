"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SaveButtonProps {
  opportunityId: string;
  initialSaved: boolean;
  className?: string;
}

/**
 * زر حفظ/إلغاء حفظ فرصة — يُستخدم داخل OpportunityCard وصفحة تفاصيل الفرصة.
 * لا يظهر إطلاقًا لغير الباحث المسجَّل؛ الأب هو من يقرر عرضه أصلاً عبر تمرير
 * isSaved (راجع OpportunityCard) — هذا المكوّن نفسه لا يتحقق من الصلاحية.
 *
 * يمنع فقاعة الحدث (stopPropagation) لأن البطاقة بأكملها رابط قابل للنقر
 * (Link يغلّف Card في opportunity-card.tsx)، فبدون هذا سيُفتح رابط الفرصة
 * كل مرة يحاول المستخدم فيها الحفظ فقط.
 */
export function SaveButton({ opportunityId, initialSaved, className }: SaveButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = React.useState(initialSaved);
  const [isPending, setIsPending] = React.useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;

    const nextSaved = !isSaved;
    setIsSaved(nextSaved); // تحديث تفاؤلي فوري
    setIsPending(true);

    try {
      const response = await fetch(`/api/saved-opportunities/${opportunityId}`, {
        method: nextSaved ? "POST" : "DELETE",
      });

      if (!response.ok) {
        setIsSaved(!nextSaved); // تراجع عن التحديث التفاؤلي عند الفشل
        toast({ variant: "error", title: nextSaved ? "تعذّر حفظ الفرصة" : "تعذّر إلغاء الحفظ" });
        return;
      }

      router.refresh(); // يُحدّث أي قائمة فرص محفوظة معروضة في نفس الصفحة
    } catch {
      setIsSaved(!nextSaved);
      toast({ variant: "error", title: "تعذّر تحديث الحفظ", description: "تحقق من اتصالك وحاول مرة أخرى." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={isSaved}
      aria-label={isSaved ? "إلغاء حفظ الفرصة" : "حفظ الفرصة"}
      title={isSaved ? "إلغاء حفظ الفرصة" : "حفظ الفرصة"}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary-600 transition-colors duration-fast hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      <Bookmark className={cn("h-4.5 w-4.5", isSaved && "fill-current")} aria-hidden="true" />
    </button>
  );
}
