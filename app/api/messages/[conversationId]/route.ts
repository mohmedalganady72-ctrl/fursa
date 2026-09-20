import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api-session";
import {
  sendMessage,
  listConversationMessages,
  markConversationMessagesAsRead,
} from "@/features/messaging/services/messages.service";

/** GET /api/messages/:conversationId — سجل الرسائل، ويعلّمها كمقروءة فور الجلب */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const session = await requireApiSession();
  if (session instanceof Response) return session;

  try {
    const messages = await listConversationMessages(conversationId, session.user.id);
    await markConversationMessagesAsRead(conversationId, session.user.id);
    return NextResponse.json({ data: messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    return NextResponse.json({ error: message }, { status: message === "FORBIDDEN" ? 403 : 404 });
  }
}

/** POST /api/messages/:conversationId — إرسال رسالة جديدة */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const session = await requireApiSession();
  if (session instanceof Response) return session;

  const { content } = await request.json().catch(() => ({ content: null }));
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "EMPTY_MESSAGE" }, { status: 400 });
  }
  if (content.trim().length > 2000) {
    return NextResponse.json({ error: "MESSAGE_TOO_LONG", message: "الرسالة أطول من الحد المسموح" }, { status: 413 });
  }

  try {
    const created = await sendMessage({ conversationId, senderId: session.user.id, content: content.trim() });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    return NextResponse.json({ error: message }, { status: message === "FORBIDDEN" ? 403 : 404 });
  }
}
