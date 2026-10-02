import assert from "node:assert/strict";
import test from "node:test";
import { ProductEventService } from "../src/modules/analytics/service";

test("product events use an idempotency key and strip sensitive properties", async () => {
  let values: Record<string, unknown> | undefined;
  let target: unknown;
  const database = {
    insert: () => ({ values: (input: Record<string, unknown>) => { values = input; return { onConflictDoNothing: (inputTarget: unknown) => { target = inputTarget; return Promise.resolve(); } }; } }),
  };
  const events = new ProductEventService(database as never);
  await events.record("match_analysis_result", "match-result:request-1", "11111111-1111-4111-8111-111111111111", { result: "success", resumeText: "نباید ذخیره شود", phone: "0912" });
  assert.equal(values?.name, "match_analysis_result");
  assert.equal(values?.idempotencyKey, "match-result:request-1");
  assert.deepEqual(values?.properties, { result: "success" });
  assert.ok(target);
});
