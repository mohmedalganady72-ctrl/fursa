import { NextResponse } from "next/server";
import { getServerSession } from "./session";

export async function requireApiSession() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "UNAUTHENTICATED", message: "انتهت جلستك. سجّل الدخول مجددًا." }, { status: 401 });
    if (session.user.isRestricted) return NextResponse.json({ error: "ACCOUNT_RESTRICTED", message: "حسابك مقيّد. تواصل مع فريق الدعم." }, { status: 403 });
    return session;
  } catch (error) {
    console.error("[auth] session lookup failed", error);
    return NextResponse.json({ error: "SESSION_UNAVAILABLE", message: "تعذّر التحقق من الجلسة. حاول مرة أخرى بعد قليل." }, { status: 503 });
  }
}
