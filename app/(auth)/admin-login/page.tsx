import { AdminLoginForm } from "@/features/auth/components/admin-login-form";

// لا فهرسة لهذه الصفحة في محركات البحث — راجع app/robots.ts
export const metadata = { robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
