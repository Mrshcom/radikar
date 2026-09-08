import assert from "node:assert/strict";
import test from "node:test";
import { toPersianServiceErrorMessage } from "../lib/service-error-message.ts";

test("localizes browser network failures", () => {
  assert.equal(
    toPersianServiceErrorMessage(new TypeError("Failed to fetch")),
    "ارتباط با سرویس برقرار نشد. لطفاً اتصال شبکه را بررسی و دوباره تلاش کنید.",
  );
  assert.equal(
    toPersianServiceErrorMessage(new TypeError("Load failed")),
    "ارتباط با سرویس برقرار نشد. لطفاً اتصال شبکه را بررسی و دوباره تلاش کنید.",
  );
});

test("localizes technical service and model failures", () => {
  assert.equal(
    toPersianServiceErrorMessage("DeepSeek returned empty content after 2 retries"),
    "مدل پس از ۲ تلاش پاسخی برنگرداند. لطفاً دوباره تلاش کنید.",
  );
  assert.equal(
    toPersianServiceErrorMessage("Request timed out"),
    "زمان پاسخ‌گویی سرویس بیش از حد مجاز شد. لطفاً دوباره تلاش کنید.",
  );
  assert.equal(
    toPersianServiceErrorMessage("Internal Server Error"),
    "خطای داخلی سرویس رخ داد. لطفاً دوباره تلاش کنید.",
  );
});

test("preserves Persian API messages and hides unknown English details", () => {
  assert.equal(
    toPersianServiceErrorMessage("شماره همراه معتبر نیست."),
    "شماره همراه معتبر نیست.",
  );
  assert.equal(
    toPersianServiceErrorMessage("ECONNRESET at upstream socket"),
    "ارتباط با سرویس ناموفق بود.",
  );
});
