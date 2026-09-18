"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineFeedback } from "@/components/shared/inline-feedback";

export function AdminProfileForm({ displayName: initialName, email: initialEmail }: {
  displayName: string;
  email: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = React.useState(initialName);
  const [email, setEmail] = React.useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ variant: "error" | "success"; message: string } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFeedback({ variant: "error", message: result.message ?? "تحقق من البيانات، ثم حاول مرة أخرى." });
        return;
      }
      setFeedback({ variant: "success", message: "حُفظ الاسم والبريد الإلكتروني بنجاح." });
      router.refresh();
    } catch {
      setFeedback({ variant: "error", message: "تحقق من اتصالك بالإنترنت، ثم حاول مرة أخرى." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-profile-name">الاسم</Label>
        <Input id="admin-profile-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={80} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-profile-email">البريد الإلكتروني</Label>
        <Input id="admin-profile-email" type="email" dir="ltr" className="text-right" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      {feedback ? <InlineFeedback variant={feedback.variant} title={feedback.variant === "success" ? "تم تحديث الحساب" : "تعذّر تحديث الحساب"} message={feedback.message} /> : null}
      <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting} className="mt-1 w-fit min-w-36">
        حفظ التغييرات
      </Button>
    </form>
  );
}
