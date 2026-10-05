import assert from "node:assert/strict";
import test from "node:test";
import { asObject, hasResumeContent, serializeResumeSkills, validateJobDescription } from "../src/modules/ai/helpers";

test("AI helper input guards normalize objects and resume content", () => {
  assert.deepEqual(asObject(null), {});
  assert.deepEqual(asObject(["x"]), {});
  assert.deepEqual(asObject({ summary: "ok" }), { summary: "ok" });
  assert.equal(hasResumeContent({ photoUrl: "x" }), false);
  assert.equal(hasResumeContent({ summary: "  رزومه  " }), true);
  assert.equal(hasResumeContent({ skills: ["React"] }), true);
});

test("job description validation rejects short/repetitive text and accepts a real description", () => {
  assert.equal(validateJobDescription("کوتاه").valid, false);
  assert.equal(validateJobDescription("این متن ".repeat(30)).valid, false);
  const valid =
    "ما به دنبال توسعه‌دهنده فرانت‌اند هستیم که مسئولیت طراحی رابط کاربری، نگهداری کد، همکاری با تیم محصول، تست و بهبود تجربه کاربر را بر عهده بگیرد و با React و TypeScript کار کند.";
  assert.deepEqual(validateJobDescription(valid), { valid: true });
});

test("resume skills serialization preserves phrases and splits standalone technical tokens", () => {
  assert.equal(serializeResumeSkills(["React, TypeScript", "حل مسئله"]), "React, TypeScript, حل مسئله");
  assert.equal(serializeResumeSkills("HTML CSS JS"), "HTML, CSS, JS");
  assert.equal(serializeResumeSkills(null), "");
});
