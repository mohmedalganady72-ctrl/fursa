import { LoginForm } from "@/features/auth/components/login-form";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { getPostAuthPath } from "@/lib/auth/destination";

export default async function LoginPage() {
  const session = await getServerSession().catch(() => null);
  if (session) redirect(await getPostAuthPath(session));
  return <LoginForm />;
}
