// نستخدم مكتبة تحليل PDF خفيفة تعمل في بيئة Node بدون الحاجة لمتصفح كامل (لا Puppeteer).
// يُضاف الاعتماد الفعلي عند تثبيت الحزم: `unpdf` أو `pdf-parse` (يُحسَم الاختيار النهائي
// في مرحلة الإعداد الفعلي بناءً على استقرار الحزمة مع Next.js/Edge Runtime وقتها).
import { extractText, getDocumentProxy } from "unpdf";

/**
 * يستخرج النص الخام من ملف PDF (السيرة الذاتية المرفوعة).
 * يُستدعى من app/api/cv/parse/route.ts بعد تحميل الملف من Supabase Storage.
 * الخطوة التالية (تحويل هذا النص لبيانات منظَّمة) تحدث في llm-structurer.ts —
 * فصل الخطوتين يسمح باختبار كل واحدة بمعزل عن الأخرى.
 */
export async function extractTextFromPdf(fileBuffer: ArrayBuffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
  const { text } = await extractText(pdf, { mergePages: true });

  if (!text || text.trim().length < 50) {
    // نص قصير جدًا يعني على الأرجح ملف PDF ممسوح ضوئيًا (صورة) بلا طبقة نص فعلية —
    // حالة يجب معالجتها بوضوح في الواجهة بدل تمرير نتيجة تحليل فارغة بصمت
    throw new Error("PDF_TEXT_LAYER_TOO_SHORT");
  }

  return text.trim();
}
