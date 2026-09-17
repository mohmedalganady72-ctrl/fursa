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
      <h1 className="text-h2 text-neutral-800">حدث خطأ غير متوقع</h1>
      <p className="max-w-md text-body text-secondary">
        نعتذر عن الإزعاج. حاول تحديث الصفحة، وإذا استمرت المشكلة تواصل معنا.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-primary-600 px-6 py-2.5 text-body font-medium text-on-primary transition-colors duration-fast hover:bg-primary-700"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
