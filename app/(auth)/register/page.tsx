import { RegisterForm } from "@/features/auth/components/register-form";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { getPostAuthPath } from "@/lib/auth/destination";

export default async function RegisterPage() {
  const session = await getServerSession().catch(() => null);
  if (session) redirect(await getPostAuthPath(session));
  return <RegisterForm />;
}
