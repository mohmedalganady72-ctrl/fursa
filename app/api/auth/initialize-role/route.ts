import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

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
  const [updated] = await db
    .update(users)
    .set({
      role: parsed.data.role,
      isActive: parsed.data.role === "applicant",
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, session.user.id), gt(users.createdAt, registrationWindow)))
    .returning({ role: users.role });

  if (!updated) {
    const existing = await db.query.users.findFirst({
      columns: { role: true },
      where: eq(users.id, session.user.id),
    });
    return NextResponse.json({ data: { role: existing?.role ?? session.user.role } });
  }

  return NextResponse.json({ data: updated });
}
