import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api-session";
import { isApplicant } from "@/features/auth/services/permissions";
import { extractTextFromPdf } from "@/features/cv-parsing/services/pdf-extractor";
import { structureResumeData } from "@/features/cv-parsing/services/llm-structurer";
import { getSignedUrl, STORAGE_BUCKETS } from "@/lib/supabase/storage";
import { db } from "@/lib/db";
import { applicantProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/cv/parse
 * يُستدعى بعد رفع الباحث لسيرته الذاتية — يستخرج النص ثم يحوّله لبيانات منظّمة.
 * الـ route نفسه رقيق: يتحقق من الصلاحية فقط ثم يفوّض العمل الفعلي لطبقة features/.
 */
export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  if (!isApplicant(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const resumePath = body?.resumePath;
  if (typeof resumePath !== "string" || !resumePath.startsWith(`${session.user.id}/`) || resumePath.includes("..")) {
    return NextResponse.json({ error: "MISSING_RESUME_PATH" }, { status: 400 });
  }

  try {
    const signedUrl = await getSignedUrl({ bucket: STORAGE_BUCKETS.RESUMES, path: resumePath });
    const fileResponse = await fetch(signedUrl);
    const fileBuffer = await fileResponse.arrayBuffer();

    const rawText = await extractTextFromPdf(fileBuffer);
    const structuredData = await structureResumeData(rawText);
    await db.update(applicantProfiles).set({ resumeUrl: resumePath, parsedResume: structuredData,
      resumeParsedAt: new Date(), updatedAt: new Date() }).where(eq(applicantProfiles.userId, session.user.id));

    return NextResponse.json({ data: structuredData });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "PDF_TEXT_LAYER_TOO_SHORT") {
      return NextResponse.json(
        { error: "PDF_TEXT_LAYER_TOO_SHORT", message: "تعذّر قراءة النص من الملف. تأكد من أن الملف ليس صورة ممسوحة ضوئيًا." },
        { status: 422 }
      );
    }

    return NextResponse.json({ error: "PARSING_FAILED", message }, { status: 500 });
  }
}
