import { RegisterForm } from "@/features/auth/components/register-form";
import { SessionRedirect } from "@/components/shared/session-redirect";

export default function RegisterPage() {
  return <><SessionRedirect /><RegisterForm /></>;
}
