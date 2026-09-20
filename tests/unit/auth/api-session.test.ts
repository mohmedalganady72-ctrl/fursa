import { beforeEach, describe, expect, it, vi } from "vitest";
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession: getSession }));
import { requireApiSession } from "@/lib/auth/api-session";

describe("API session responses", () => {
  beforeEach(() => vi.clearAllMocks());
  it("returns 401 for an expired session", async () => {
    getSession.mockResolvedValue(null);
    const result = await requireApiSession();
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });
  it("returns 403 for a restricted account", async () => {
    getSession.mockResolvedValue({ user: { isRestricted: true } });
    expect(((await requireApiSession()) as Response).status).toBe(403);
  });
  it("reports service unavailability without exposing database details", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    getSession.mockRejectedValue(new Error("private connection string"));
    const result = (await requireApiSession()) as Response;
    expect(result.status).toBe(503);
    expect(await result.text()).not.toContain("private connection string");
    spy.mockRestore();
  });
  it("preserves a valid session", async () => {
    const session = { user: { id: "one", isRestricted: false } };
    getSession.mockResolvedValue(session);
    expect(await requireApiSession()).toBe(session);
  });
});
