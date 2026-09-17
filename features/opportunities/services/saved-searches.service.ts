import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedSearches } from "@/lib/db/schema";
import type { SavedSearchInput } from "../validators/saved-search.schema";

export async function createSavedSearch(applicantProfileId: string, input: SavedSearchInput) {
  const [created] = await db
    .insert(savedSearches)
    .values({
      applicantProfileId,
      label: input.label,
      queryText: input.queryText,
      filters: input.filters,
    })
    .returning();

  if (!created) throw new Error("SAVED_SEARCH_CREATE_FAILED");

  return created;
}

export async function listSavedSearches(applicantProfileId: string) {
  return db.query.savedSearches.findMany({
    where: eq(savedSearches.applicantProfileId, applicantProfileId),
    orderBy: desc(savedSearches.createdAt),
  });
}

/**
 * الحذف يتحقق من ملكية الباحث للبحث المحفوظ ضمن شرط WHERE نفسه (وليس فحصًا منفصلاً
 * قبل الحذف) — يمنع ثغرة IDOR حيث يحاول مستخدم حذف سجل بحث محفوظ يخص مستخدمًا آخر
 * عبر تمرير معرّف تخمينًا (راجع وثيقة المتطلبات § 9: "منع IDOR للوصول إلى ملفات
 * المستخدمين أو الطلبات" و"التحقق من ملكية المستخدم للموارد قبل عرضها").
 */
export async function deleteSavedSearch(savedSearchId: string, applicantProfileId: string) {
  const deleted = await db
    .delete(savedSearches)
    .where(
      and(eq(savedSearches.id, savedSearchId), eq(savedSearches.applicantProfileId, applicantProfileId))
    )
    .returning({ id: savedSearches.id });

  if (deleted.length === 0) {
    throw new Error("SAVED_SEARCH_NOT_FOUND_OR_FORBIDDEN");
  }
}
