import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { getPostAuthPath } from "@/lib/auth/destination";
import { getServerSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) redirect(await getPostAuthPath(session));

  return <LoginForm />;
}
