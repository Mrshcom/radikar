import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function request(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) return sourceFiles(url);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [url] : [];
  }));
  return nested.flat();
}

test("home redirects to the dynamic dashboard", async () => {
  const response = await request("/");
  assert.ok([307, 308].includes(response.status));
  assert.equal(new URL(response.headers.get("location"), "http://localhost").pathname, "/dashboard");
});

test("uses an IndexedDB repository with a swappable HTTP adapter", async () => {
  const [repository, stores, models] = await Promise.all([
    readFile(new URL("lib/data/repository.ts", projectRoot), "utf8"),
    readFile(new URL("lib/data/stores.ts", projectRoot), "utf8"),
    readFile(new URL("lib/data/models.ts", projectRoot), "utf8"),
  ]);

  assert.match(repository, /class IndexedDbRepository/);
  assert.match(repository, /class HttpDataRepository/);
  assert.match(repository, /NEXT_PUBLIC_DATA_SOURCE/);
  assert.match(repository, /NEXT_PUBLIC_DATA_API_BASE_URL/);
  assert.match(stores, /userProfileStore/);
  assert.match(stores, /resumeStore/);
  assert.match(stores, /jobStore/);
  assert.match(stores, /applicationStore/);
  assert.match(stores, /interviewSessionStore/);
  assert.match(stores, /matchAnalysisStore/);
  assert.match(models, /dashboardSnapshots/);
});

test("starts with empty user data and does not use browser string storage", async () => {
  const resumeData = await readFile(new URL("app/(panel)/resumes/resume-data.ts", projectRoot), "utf8");
  const files = [
    ...await sourceFiles(new URL("app/", projectRoot)),
    ...await sourceFiles(new URL("lib/", projectRoot)),
  ];
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");

  assert.match(resumeData, /export const emptyResumeData/);
  assert.doesNotMatch(source, /\blocalStorage\b|\bsessionStorage\b/);
  assert.doesNotMatch(source, /سینا احمدی|شرکت پیشنهادی|موقعیت مرتبط|Product Lead/);
});
