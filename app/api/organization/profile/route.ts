import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api-session";
import { isOrganization } from "@/features/auth/services/permissions";
import { organizationProfileSchema } from "@/features/organizations/validators/organization-profile.schema";
import {
  createOrganizationProfile,
  updateOrganizationProfile,
  getOrganizationProfileByUserId,
} from "@/features/organizations/services/organization-profile.service";

export async function GET() {
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  const profile = await getOrganizationProfileByUserId(session.user.id);
  return NextResponse.json({ data: profile });
}

export async function PATCH(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  if (!isOrganization(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = organizationProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await getOrganizationProfileByUserId(session.user.id);

  const result = existing
    ? await updateOrganizationProfile(existing.id, parsed.data)
    : await createOrganizationProfile(session.user.id, parsed.data);

  return NextResponse.json({ data: result });
}
