import { CreateAdminForm } from "@/features/admin/components/create-admin-form";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreateAdminPage() {
  return (
    <div>
      <Button asChild variant="ghost" className="mb-4"><Link href="/admin/admins"><ArrowRight className="h-4 w-4 rtl-flip" />العودة إلى المديرين</Link></Button>
      <h1 className="text-h1 text-neutral-900">إنشاء حساب مدير جديد</h1>
      <p className="mt-1 text-body text-secondary">
        يدخل المدير الجديد بنفس آلية دخولكم — عبر رابط تسجيل الدخول الخاص بالمدراء
      </p>

      <div className="mt-6 max-w-md">
        <CreateAdminForm />
      </div>
    </div>
  );
}
