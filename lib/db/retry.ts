const TRANSIENT_DATABASE_CODES = new Set([
  "57014",
  "CONNECT_TIMEOUT",
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "57P01",
  "57P02",
  "57P03",
]);

export function isTransientDatabaseError(error: unknown): boolean {
  let current: unknown = error;
  while (current && typeof current === "object") {
    const candidate = current as { code?: string; cause?: unknown };
    if (candidate.code && TRANSIENT_DATABASE_CODES.has(candidate.code)) return true;
    current = candidate.cause;
  }
  return false;
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function withDatabaseRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientDatabaseError(error) || attempt === attempts - 1) throw error;
      await wait(250 * (attempt + 1));
    }
  }
  throw lastError;
}
