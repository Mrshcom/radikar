import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { promisify } from "node:util";
import { createDatabase } from "@radikar/database";
import postgres from "postgres";
import { ProductTimelineError, ProductTimelineService } from "../src/modules/product-timeline/service";

const execFileAsync = promisify(execFile);
const root = new URL("../../../", import.meta.url).pathname;
const adminUrl = "postgresql://radikar:radikar@127.0.0.1:5433/postgres";

test("timeline publication and archive use real PostgreSQL", { timeout: 60_000 }, async () => {
  const name = `radikar_timeline_test_${randomUUID().replaceAll("-", "")}`;
  const url = `postgresql://radikar:radikar@127.0.0.1:5433/${name}`;
  const admin = postgres(adminUrl, { max: 1 });
  let connection: ReturnType<typeof createDatabase> | undefined;
  try {
    await admin.unsafe(`CREATE DATABASE ${name}`);
    await execFileAsync("node", ["--import", "tsx", "packages/database/src/migrate.ts"], {
      cwd: root,
      env: { ...process.env, DATABASE_URL: url },
    });
    connection = createDatabase(url, 2);
    const service = new ProductTimelineService(connection.db);
    const phase = await service.create({
      kind: "phase",
      phaseId: null,
      title: "فاز آزمایشی",
      summary: "شرح مرحلهٔ آزمایشی",
      status: "building",
      sortOrder: 1,
      storySlides: [],
    });
    const feature = await service.create({
      kind: "feature",
      phaseId: phase.id,
      title: "قابلیت آزمایشی",
      summary: "شرح قابلیت آزمایشی",
      status: "completed",
      sortOrder: 2,
      storySlides: [{ title: "اسلاید نخست", body: "شرح اسلاید نخست" }],
    });
    await assert.rejects(
      service.publish(feature.id),
      (error: unknown) => error instanceof ProductTimelineError && error.status === 409,
    );
    await service.publish(phase.id);
    const published = await service.publish(feature.id);
    assert.ok(published.publishedAt);
    assert.deepEqual(
      (await service.listPublished()).map((item) => item.id),
      [phase.id, feature.id],
    );
    await assert.rejects(
      service.unpublish(phase.id),
      (error: unknown) => error instanceof ProductTimelineError && error.status === 409,
    );
    await service.unpublish(feature.id);
    await service.unpublish(phase.id);
    assert.deepEqual(await service.listPublished(), []);
    await service.remove(feature.id);
    await service.remove(phase.id);
  } finally {
    await connection?.close();
    await admin.unsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await admin.end({ timeout: 5 });
  }
});
