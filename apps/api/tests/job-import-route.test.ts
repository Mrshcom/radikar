import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { registerJobImportRoute } from "../src/modules/imports/job-import";

async function createApp() {
  const app = Fastify({ logger: false });
  registerJobImportRoute(app);
  return app;
}

test("job import returns normalized HTML, canonical LinkedIn URL and logo", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(`
    <meta property="og:image" content="https://cdn.example.com/logo.png">
    <script type="application/ld+json">{"@type":"JobPosting","description":"ما به دنبال توسعه‌دهنده فرانت‌اند با تجربه React و TypeScript هستیم. مسئولیت‌ها شامل ساخت رابط کاربری، همکاری با محصول، نوشتن تست و بهبود کیفیت محصول است."}</script>`, { headers: { "content-type": "text/html" } });
  try {
    const app = await createApp();
    const response = await app.inject({ method: "POST", url: "/api/job-import", payload: { url: "https://www.linkedin.com/jobs/view/senior-123456789/" } });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().sourceUrl, "https://www.linkedin.com/jobs/view/123456789/");
    assert.match(response.json().text, /React/);
    await app.close();
  } finally { globalThis.fetch = originalFetch; }
});

test("job import rejects redirects, non-HTML and insufficient external content", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(null, { status: 302 });
    let app = await createApp();
    assert.equal((await app.inject({ method: "POST", url: "/api/job-import", payload: { url: "https://jobinja.ir/job/1" } })).statusCode, 400);
    await app.close();
    globalThis.fetch = async () => new Response("file", { headers: { "content-type": "application/pdf" } });
    app = await createApp();
    assert.equal((await app.inject({ method: "POST", url: "/api/job-import", payload: { url: "https://jobinja.ir/job/1" } })).statusCode, 415);
    await app.close();
    globalThis.fetch = async () => new Response("short", { headers: { "content-type": "text/html" } });
    app = await createApp();
    assert.equal((await app.inject({ method: "POST", url: "/api/job-import", payload: { url: "https://jobinja.ir/job/1" } })).statusCode, 422);
    await app.close();
  } finally { globalThis.fetch = originalFetch; }
});
