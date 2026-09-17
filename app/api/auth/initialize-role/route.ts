import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { withDatabaseRetry } from "@/lib/db/retry";

const bodySchema = z.object({
  role: z.enum(["applicant", "organization"]),
});

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_ROLE" }, { status: 400 });
  }

  const registrationWindow = new Date(Date.now() - 15 * 60 * 1000);
  const [updated] = await withDatabaseRetry(() => db
    .update(users)
    .set({
      role: parsed.data.role,
      isActive: parsed.data.role === "applicant",
      updatedAt: new Date(),
    })
    .where(and(
      eq(users.id, session.user.id),
      gt(users.createdAt, registrationWindow),
      eq(users.role, "applicant"),
      eq(users.isActive, false),
    ))
    .returning({ role: users.role }));

  const result = updated ?? await withDatabaseRetry(() => db.query.users.findFirst({
      columns: { role: true },
      where: eq(users.id, session.user.id),
    }));

  if (!result) return NextResponse.json({ error: "USER_NOT_FOUND", message: "تعذّر العثور على الحساب." }, { status: 404 });

  // The Firebase endpoint creates the session cookie before this route sets the
  // selected role. Bypass the old cookie cache once and return its fresh headers.
  const refreshed = await auth.api.getSession({
    headers: request.headers,
    query: { disableCookieCache: true },
    returnHeaders: true,
  });

  return NextResponse.json({ data: result }, { headers: refreshed.headers });
}
