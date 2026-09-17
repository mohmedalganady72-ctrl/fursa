import { LoginForm } from "@/features/auth/components/login-form";
import { SessionRedirect } from "@/components/shared/session-redirect";

export default function LoginPage() {
  return <><SessionRedirect /><LoginForm /></>;
}
