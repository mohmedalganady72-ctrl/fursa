import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../../../middleware";

function request(path: string, cookie?: string) {
  return new NextRequest(`https://fursa.example${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("authentication middleware", () => {
  it("preserves the full protected path when redirecting to login", () => {
    const response = middleware(request("/applicant/opportunities?type=job"));
    const location = new URL(response.headers.get("location")!);

    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirectTo")).toBe("/applicant/opportunities?type=job");
  });

  it.each([
    "better-auth.session_token=local-token",
    "__Secure-better-auth.session_token=production-token",
  ])("accepts the Better Auth session cookie %s", (cookie) => {
    const response = middleware(request("/applicant/dashboard", cookie));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("uses the private admin login route for an unauthenticated admin request", () => {
    const response = middleware(request("/admin/reports"));
    expect(new URL(response.headers.get("location")!).pathname).toBe("/admin-login");
  });
});
