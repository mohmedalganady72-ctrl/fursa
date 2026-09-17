import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getPostAuthPath } from "@/lib/auth/destination";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  return NextResponse.json({ data: { path: await getPostAuthPath(session) } });
}
