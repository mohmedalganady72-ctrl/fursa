"use client";

import * as React from "react";
import { Ban, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InlineFeedback } from "@/components/shared/inline-feedback";

interface AccountRestrictionButtonProps {
  userId: string;
  userName: string;
  isRestricted: boolean;
  reportId?: string;
}

export function AccountRestrictionButton({
  userId,
  userName,
  isRestricted,
  reportId,
}: AccountRestrictionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const nextRestricted = !isRestricted;

  async function updateRestriction() {
    setPending(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}/restriction`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restricted: nextRestricted, reportId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message ?? "تعذّر تحديث حالة الحساب.");

      setOpen(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "حاول مرة أخرى.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant={isRestricted ? "outline" : "danger"}>
          {isRestricted ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          {isRestricted ? "تمكين" : "تقييد"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{nextRestricted ? "تقييد الحساب" : "إعادة تمكين الحساب"}</DialogTitle>
          <DialogDescription>
            {nextRestricted
              ? `سيُمنع ${userName} من استخدام المنصة، وستظهر له رسالة تطلب التواصل مع فريق الدعم.`
              : `سيستعيد ${userName} إمكانية استخدام المنصة بصورة طبيعية.`}
          </DialogDescription>
        </DialogHeader>
        {errorMessage ? <InlineFeedback title="تعذّر تحديث حالة الحساب" message={errorMessage} /> : null}
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost" disabled={pending}>إلغاء</Button></DialogClose>
          <Button
            type="button"
            variant={nextRestricted ? "danger" : "primary"}
            onClick={updateRestriction}
            isLoading={pending}
            disabled={pending}
          >
            {nextRestricted ? "تأكيد التقييد" : "تأكيد التمكين"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
