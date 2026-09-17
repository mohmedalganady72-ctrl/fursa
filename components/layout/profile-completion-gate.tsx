"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { PlatformLoader } from "@/components/shared/platform-loader";

export function ProfileCompletionGate({ complete, profilePath, children }: {
  complete: boolean;
  profilePath: "/applicant/profile" | "/organization/profile";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const canRender = complete || pathname === profilePath;

  React.useEffect(() => {
    if (!canRender) router.replace(profilePath);
  }, [canRender, profilePath, router]);

  if (!canRender) {
    return <PlatformLoader message="جارٍ الانتقال إلى استكمال الملف الشخصي..." />;
  }
  return children;
}
