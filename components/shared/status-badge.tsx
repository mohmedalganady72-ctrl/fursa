import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/lib/constants";

const STATUS_VARIANTS: Record<ApplicationStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  applied: "info",
  under_review: "info",
  shortlisted: "warning",
  accepted: "success",
  rejected: "danger",
  withdrawn: "neutral",
  closed: "neutral",
};

/** شارة حالة التقديم — تُستخدم في لوحة "تقديماتي" وقائمة متقدمي الجهة */
export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{APPLICATION_STATUS_LABELS[status]}</Badge>;
}
