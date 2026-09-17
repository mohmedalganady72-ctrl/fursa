import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/features/auth/components/admin-login-form";
import { getPostAuthPath } from "@/lib/auth/destination";
import { getServerSession } from "@/lib/auth/session";

// لا فهرسة لهذه الصفحة في محركات البحث — راجع app/robots.ts
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  const session = await getServerSession();
  if (session) redirect(await getPostAuthPath(session));

  return <AdminLoginForm />;
}
