import { describe, it, expect, vi } from "vitest";

/**
 * اختبارات extractTextFromPdf مبنية على تزييف (mock) مكتبة unpdf بدل تحميل
 * ملفات PDF فعلية أثناء الاختبار — يبقي الاختبار سريعًا ومركّزًا على منطقنا
 * الخاص (فحص طول النص المستخرج) وليس على صحة مكتبة خارجية.
 */
vi.mock("unpdf", () => ({
  getDocumentProxy: vi.fn().mockResolvedValue({}),
  extractText: vi.fn(),
}));

describe("extractTextFromPdf", () => {
  it("يرمي خطأ PDF_TEXT_LAYER_TOO_SHORT عند نص مستخرج قصير جدًا (ملف ممسوح ضوئيًا)", async () => {
    const { extractText } = await import("unpdf");
    vi.mocked(extractText).mockResolvedValueOnce({ text: "قصير جدًا" } as any);

    const { extractTextFromPdf } = await import("@/features/cv-parsing/services/pdf-extractor");

    await expect(extractTextFromPdf(new ArrayBuffer(8))).rejects.toThrow(
      "PDF_TEXT_LAYER_TOO_SHORT"
    );
  });

  it("يُرجع النص بنجاح عند وجود طبقة نص كافية", async () => {
    const longText = "هذا نص سيرة ذاتية كافٍ الطول ".repeat(5);
    const { extractText } = await import("unpdf");
    vi.mocked(extractText).mockResolvedValueOnce({ text: longText } as any);

    const { extractTextFromPdf } = await import("@/features/cv-parsing/services/pdf-extractor");
    const result = await extractTextFromPdf(new ArrayBuffer(8));

    expect(result.length).toBeGreaterThan(50);
    expect(result).toBe(longText.trim());
  });
});
