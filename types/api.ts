/**
 * شكل استجابة موحّد لكل مسارات الـ API في المشروع — يُستخدم كنوع مرجعي
 * عند كتابة استدعاءات fetch من مكوّنات العميل، لضمان توقّع نفس البنية
 * (data على النجاح، error/message على الفشل) في كل مكان.
 */
export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function isApiError(response: unknown): response is ApiErrorResponse {
  return typeof response === "object" && response !== null && "error" in response;
}
