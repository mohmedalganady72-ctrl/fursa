import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api-session";
import { STORAGE_BUCKETS, getPublicUrl, uploadFile } from "@/lib/supabase/storage";

const CONFIG = {
  resume: { bucket: STORAGE_BUCKETS.RESUMES, max: 10 * 1024 * 1024, extension: "pdf", public: false },
  avatar: { bucket: STORAGE_BUCKETS.AVATARS, max: 5 * 1024 * 1024, extension: "webp", public: true },
  logo: { bucket: STORAGE_BUCKETS.ORGANIZATION_LOGOS, max: 5 * 1024 * 1024, extension: "webp", public: true },
} as const;

function detectFile(bytes: Uint8Array) {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])) return "png";
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
  if (session instanceof Response) return session;
    const form = await request.formData();
    const kind = form.get("kind");
    const file = form.get("file");
    if (!(file instanceof File) || typeof kind !== "string" || !(kind in CONFIG)) {
      return NextResponse.json({ error: "INVALID_UPLOAD", message: "بيانات الملف غير صالحة" }, { status: 400 });
    }
    if ((kind === "logo" && session.user.role !== "organization") || (kind !== "logo" && session.user.role !== "applicant")) {
      return NextResponse.json({ error: "FORBIDDEN", message: "لا تملك صلاحية رفع هذا النوع من الملفات" }, { status: 403 });
    }
    const config = CONFIG[kind as keyof typeof CONFIG];
    if (file.size === 0 || file.size > config.max) {
      return NextResponse.json({ error: "FILE_TOO_LARGE", message: "حجم الملف يتجاوز الحد المسموح" }, { status: 413 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectFile(buffer.subarray(0, 16));
    if (kind === "resume" ? detected !== "pdf" : !["jpeg", "png", "webp"].includes(detected ?? "")) {
      return NextResponse.json({ error: "INVALID_FILE_TYPE", message: "صيغة الملف غير مدعومة" }, { status: 415 });
    }
    const extension = kind === "resume" ? "pdf" : detected;
    const path = `${session.user.id}/${kind}-${randomUUID()}.${extension}`;
    await uploadFile({ bucket: config.bucket, path, file: buffer,
      contentType: kind === "resume" ? "application/pdf" : `image/${detected}` });
    return NextResponse.json({ data: { path, url: config.public ? getPublicUrl({ bucket: config.bucket, path }) : undefined } }, { status: 201 });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "UNKNOWN_UPLOAD_ERROR";
    if (rawMessage === "UNAUTHENTICATED") {
      return NextResponse.json(
        { error: "UNAUTHENTICATED", message: "يجب تسجيل الدخول أولًا" },
        { status: 401 },
      );
    }
    const configurationError = /row-level security|jwt|service.?role/i.test(rawMessage);
    console.error("[uploads]", rawMessage);
    return NextResponse.json({
      error: configurationError ? "STORAGE_CONFIGURATION_ERROR" : "UPLOAD_FAILED",
      message: configurationError
        ? "خدمة رفع الملفات غير متاحة حاليًا. حاول مرة أخرى لاحقًا."
        : "تعذّر رفع الملف. حاول مرة أخرى.",
    }, { status: configurationError ? 503 : 500 });
  }
}
