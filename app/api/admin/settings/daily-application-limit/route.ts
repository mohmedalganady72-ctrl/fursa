import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { isAdmin } from "@/features/auth/services/permissions";
import {
  getDailyApplicationLimitPerType,
  setDailyApplicationLimitPerType,
} from "@/features/admin/services/system-settings.service";

/** GET/PATCH لقيمة الحد اليومي للتقديم — إعداد قابل للتعديل من لوحة المدير (§ 5.12) */
export async function GET() {
  const value = await getDailyApplicationLimitPerType();
  return NextResponse.json({ data: { value } });
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = z.object({ value: z.number().int().min(1).max(50) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  await setDailyApplicationLimitPerType(parsed.data.value);
  return NextResponse.json({ success: true });
}
