import { BroadcastForm } from "@/features/admin/components/broadcast-form";

export default function AdminBroadcastPage() {
  return (
    <div>
      <h1 className="text-h1 text-neutral-900">إرسال إشعار</h1>
      <p className="mt-1 text-body text-secondary">
        يصل الإشعار فورًا لكل مستخدمي الفئة المختارة (صيانة، تحديث، سياسة استخدام...)
      </p>

      <div className="mt-6 max-w-xl">
        <BroadcastForm />
      </div>
    </div>
  );
}
