import { describe, expect, it } from "vitest";
import { loginDestination, portalFromLoginQuery } from "@/lib/login-destination";

describe("login portal routing", () => {
  it("opens employer mode for protected employer links", () => {
    expect(portalFromLoginQuery("?next=%2Femployer%2Fpositions%2F123")).toBe("employer");
    expect(loginDestination("employer", "/employer/positions/123")).toBe("/employer/positions/123");
  });

  it("keeps candidate invitation deep links and rejects cross-portal and external redirects", () => {
    expect(loginDestination("candidate", "/interview-invites/invite")).toBe("/interview-invites/invite");
    expect(loginDestination("candidate", "/employer/positions")).toBe("/dashboard");
    expect(loginDestination("employer", "//evil.example")).toBe("/dashboard");
    expect(loginDestination("employer", "/dashboard")).toBe("/dashboard");
    expect(loginDestination("employer", "/employer/positions", "admin")).toBe("/admin");
  });
});
