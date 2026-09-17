import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getPostAuthPath } from "@/lib/auth/destination";
import { getServerSession } from "@/lib/auth/session";

export default async function RegisterPage() {
  const session = await getServerSession();
  if (session) redirect(await getPostAuthPath(session));

  return <RegisterForm />;
}
