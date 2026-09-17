import { describe, expect, it } from "vitest";
import { isRedirectAllowedForRole, normalizeRedirectPath, safeRedirectForRole } from "@/lib/auth/redirects";

describe("authentication redirects", () => {
  it("keeps valid internal paths with their query and hash", () => {
    expect(normalizeRedirectPath("/applicant/opportunities/123?source=share#details"))
      .toBe("/applicant/opportunities/123?source=share#details");
  });

  it.each([
    "https://evil.example/path",
    "//evil.example/path",
    "/\\evil.example/path",
    "login",
    "/login",
    "/register?redirectTo=/applicant/dashboard",
  ])("rejects unsafe or looping destination %s", (path) => {
    expect(normalizeRedirectPath(path)).toBeUndefined();
  });

  it("allows only the dashboard namespace belonging to the signed-in role", () => {
    expect(isRedirectAllowedForRole("/applicant/opportunities/123", "applicant")).toBe(true);
    expect(isRedirectAllowedForRole("/organization/dashboard", "applicant")).toBe(false);
    expect(isRedirectAllowedForRole("/admin/dashboard", "organization")).toBe(false);
    expect(isRedirectAllowedForRole("/admin/reports?status=open", "admin")).toBe(true);
  });

  it("drops a valid internal path when it belongs to another role", () => {
    expect(safeRedirectForRole("/admin/dashboard", "applicant")).toBeUndefined();
    expect(safeRedirectForRole("/applicant/dashboard", "organization")).toBeUndefined();
  });
});
