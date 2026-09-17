"use client";

/**
 * حدود الخطأ العامة (Error Boundary) على مستوى المشروع.
 * Next.js يستدعي هذا المكوّن تلقائيًا عند حدوث خطأ غير متوقع في أي مسار
 * لا يملك error.tsx خاصًا به.
 */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="text-h2 text-neutral-800">تعذّر تحميل الصفحة</h1>
      <p className="max-w-md text-body text-secondary">
        حاول إعادة تحميل الصفحة. إذا استمرت المشكلة، تواصل معنا لمساعدتك.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-primary-600 px-6 py-2.5 text-body font-medium !text-white transition-colors duration-300 hover:bg-primary-700 dark:bg-primary-300 dark:hover:bg-primary-200"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
