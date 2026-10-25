import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { registerRadicoinRoutes } from "../src/modules/radicoin/routes";
import type { RadicoinService } from "../src/modules/radicoin/service";

test("onboarding claim is customer-only and uses the authenticated account, not posted user or amount", async () => {
  const app = Fastify();
  const claims: string[] = [];
  app.addHook("preHandler", async (request) => {
    request.auth = {
      user: { id: "current-user", role: request.headers["x-test-role"] ?? "user" },
      sessionId: "session",
    } as NonNullable<typeof request.auth>;
  });
  const status = { amount: 100, eligible: true, claimed: false, completedSteps: [] };
  registerRadicoinRoutes(app, {
    getOnboardingRewardStatus: async () => status,
    claimOnboardingReward: async (id: string) => {
      claims.push(id);
      return { ...status, claimed: true, credited: true };
    },
  } as unknown as RadicoinService);
  try {
    const read = await app.inject({ method: "GET", url: "/api/radicoin/onboarding-reward" });
    assert.equal(read.statusCode, 200);
    assert.equal(claims.length, 0);
    const forbidden = await app.inject({
      method: "POST",
      url: "/api/radicoin/onboarding-reward/claim",
      headers: { "x-test-role": "admin" },
    });
    assert.equal(forbidden.statusCode, 403);
    const claim = await app.inject({
      method: "POST",
      url: "/api/radicoin/onboarding-reward/claim",
      payload: { userId: "other-user", amount: 999_999 },
    });
    assert.equal(claim.statusCode, 200);
    assert.equal(claim.json().amount, 100);
    assert.deepEqual(claims, ["current-user"]);
  } finally {
    await app.close();
  }
});
