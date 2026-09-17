import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getPostAuthPath } from "@/lib/auth/destination";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const requestedPath = new URL(request.url).searchParams.get("redirectTo");
  return NextResponse.json({ data: { path: await getPostAuthPath(session, requestedPath) } });
}
