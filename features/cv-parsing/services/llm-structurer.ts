import { env } from "@/lib/env";
import type { ParsedResumeData } from "../types";

/**
 * يحوّل النص الخام المستخرج من السيرة الذاتية إلى بيانات منظّمة (JSON) عبر نموذج لغوي.
 * الاعتماد على LLM بدل قواعد استخراج ثابتة (Regex) مقصود: صيغ السير الذاتية شديدة التنوع
 * (ترتيب الأقسام، اللغة، الأسلوب)، وقواعد Regex ثابتة تفشل بسرعة مع أول تنسيق غير متوقع
 * — راجع README.md § المخاطر التقنية.
 *
 * ملاحظة أمنية: النص الخام يُرسَل كاملًا للنموذج، لذا يجب التأكد أن مزوّد الـ LLM المُستخدَم
 * يلتزم بسياسة عدم الاحتفاظ بالبيانات لأغراض التدريب (Data Retention Policy) نظرًا لحساسية
 * محتوى السير الذاتية.
 */

const EXTRACTION_PROMPT = `أنت نظام استخراج بيانات من سِيَر ذاتية. اقرأ النص التالي واستخرج منه البيانات
بصيغة JSON فقط، بدون أي شرح أو نص إضافي، مطابقة تمامًا للشكل التالي:

{
  "skills": ["مهارة1", "مهارة2"],
  "yearsOfExperience": رقم أو null,
  "qualification": "نص المؤهل الأعلى المذكور" أو null,
  "specialization": "التخصص الدقيق" أو null,
  "previousJobTitles": ["مسمى وظيفي سابق 1", "مسمى وظيفي سابق 2"]
}

النص:
"""
{{RESUME_TEXT}}
"""`;

export async function structureResumeData(rawText: string): Promise<ParsedResumeData> {
  const prompt = EXTRACTION_PROMPT.replace("{{RESUME_TEXT}}", rawText.slice(0, 12000)); // حد أقصى احترازي لطول النص

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.LLM_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM_REQUEST_FAILED: ${response.status}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((block: { type: string }) => block.type === "text");

  if (!textBlock?.text) {
    throw new Error("LLM_EMPTY_RESPONSE");
  }

  // إزالة أي تنسيق Markdown محتمل (```json ... ```) قبل التحليل
  const cleanedJson = textBlock.text.replace(/```json|```/g, "").trim();

  let parsed: Partial<ParsedResumeData>;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch {
    throw new Error("LLM_INVALID_JSON");
  }

  return {
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    yearsOfExperience: typeof parsed.yearsOfExperience === "number" ? parsed.yearsOfExperience : null,
    qualification: parsed.qualification ?? null,
    specialization: parsed.specialization ?? null,
    previousJobTitles: Array.isArray(parsed.previousJobTitles) ? parsed.previousJobTitles : [],
    rawTextLength: rawText.length,
  };
}
