import { describe, expect, it, vi } from "vitest";
import { isTransientDatabaseError, withDatabaseRetry } from "@/lib/db/retry";

describe("database retry", () => {
  it("recognizes a nested ECONNRESET error", () => {
    const error = new Error("query failed", {
      cause: Object.assign(new Error("connection reset"), { code: "ECONNRESET" }),
    });

    expect(isTransientDatabaseError(error)).toBe(true);
  });

  it("retries a transient failure and returns the next result", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(Object.assign(new Error("reset"), { code: "ECONNRESET" }))
      .mockResolvedValueOnce("connected");

    await expect(withDatabaseRetry(operation, 2)).resolves.toBe("connected");
    expect(operation).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });

  it("does not retry a permanent query error", async () => {
    const operation = vi.fn<() => Promise<never>>().mockRejectedValue(new Error("invalid query"));

    await expect(withDatabaseRetry(operation)).rejects.toThrow("invalid query");
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
