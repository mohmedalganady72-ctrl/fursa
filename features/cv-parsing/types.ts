/** البيانات المنظّمة الناتجة عن تحليل السيرة الذاتية — عقد ثابت بين pdf-extractor وllm-structurer وبقية المشروع */
export interface ParsedResumeData {
  skills: string[];
  yearsOfExperience: number | null;
  qualification: string | null; // آخر مؤهل دراسي مذكور
  specialization: string | null;
  previousJobTitles: string[];
  rawTextLength: number; // لأغراض تشخيصية (هل النص المستخرج قصير بشكل مشبوه = ملف ممسوح ضوئيًا بلا طبقة نصية؟)
}
