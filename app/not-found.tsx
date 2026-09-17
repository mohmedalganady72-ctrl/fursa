import Link from "next/link";

/**
 * صفحة 404 الموحّدة للمشروع كامل.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      {/*
        صورة: رسم توضيحي لصفحة غير موجودة (404 illustration)
        المقاس المقترح: ~320×320px
        الصيغة: SVG
        ملاحظة: أسلوب بسيط منسجم مع هوية المنصة، وليس رسمًا كرتونيًا مبالغًا فيه
      */}
      <h1 className="text-h1 text-neutral-800">٤٠٤</h1>
      <p className="max-w-md text-body text-secondary">
        الصفحة التي تبحث عنها غير موجودة، أو ربما تم نقلها.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary-600 px-6 py-2.5 text-body font-medium text-on-primary transition-colors duration-fast hover:bg-primary-700"
      >
        العودة للصفحة الرئيسية
      </Link>
    </div>
  );
}
