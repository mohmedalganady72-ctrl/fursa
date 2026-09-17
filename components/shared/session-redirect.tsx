"use client";

import * as React from "react";
import { authClient } from "@/lib/auth/client";
import { resolvePostAuthPath } from "@/lib/firebase/auth-flow";

/** يعيد المستخدم ذي الجلسة الصالحة إلى لوحته دون تعطيل عرض الصفحات العامة. */
export function SessionRedirect() {
  React.useEffect(() => {
    let cancelled = false;

    async function redirectSignedInUser() {
      try {
        const session = await authClient.getSession();
        if (!cancelled && session.data) {
          window.location.replace(await resolvePostAuthPath());
        }
      } catch {
        // تظل الصفحة العامة قابلة للعرض إذا تعذّر الوصول المؤقت لخدمة الجلسات.
      }
    }

    void redirectSignedInUser();
    return () => { cancelled = true; };
  }, []);

  return null;
}
