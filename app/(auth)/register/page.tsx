import { RegisterForm } from "@/features/auth/components/register-form";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { getPostAuthPath } from "@/lib/auth/destination";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ redirectTo?: string }> }) {
  const session = await getServerSession().catch(() => null);
  if (session) redirect(await getPostAuthPath(session, (await searchParams).redirectTo));
  return <RegisterForm />;
}
