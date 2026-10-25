import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, isNotNull, lte } from "drizzle-orm";
import { productTimelineEntries, type Database } from "@radikar/database";
import type { ProductTimelineEntry, ProductTimelineInput } from "@radikar/shared-types";

export class ProductTimelineError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type TimelineRow = typeof productTimelineEntries.$inferSelect;

function toEntry(row: TimelineRow): ProductTimelineEntry {
  return {
    ...row,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class ProductTimelineService {
  constructor(private readonly database: Database) {}

  async listPublished(now = new Date()): Promise<ProductTimelineEntry[]> {
    const rows = await this.database
      .select()
      .from(productTimelineEntries)
      .where(and(isNotNull(productTimelineEntries.publishedAt), lte(productTimelineEntries.publishedAt, now)))
      .orderBy(asc(productTimelineEntries.sortOrder), desc(productTimelineEntries.publishedAt));
    const publishedPhaseIds = new Set(rows.filter((row) => row.kind === "phase").map((row) => row.id));
    return rows
      .filter((row) => row.kind === "phase" || !row.phaseId || publishedPhaseIds.has(row.phaseId))
      .map(toEntry);
  }

  async listAdmin(): Promise<ProductTimelineEntry[]> {
    const rows = await this.database
      .select()
      .from(productTimelineEntries)
      .orderBy(asc(productTimelineEntries.sortOrder), desc(productTimelineEntries.updatedAt));
    return rows.map(toEntry);
  }

  private async getRow(id: string) {
    const [row] = await this.database.select().from(productTimelineEntries).where(eq(productTimelineEntries.id, id));
    if (!row) throw new ProductTimelineError(404, "آیتم تایم‌لاین پیدا نشد.");
    return row;
  }

  private async validatePhase(input: ProductTimelineInput, entryId?: string) {
    if (input.kind === "phase") {
      if (input.phaseId) throw new ProductTimelineError(400, "فاز نمی‌تواند زیرمجموعهٔ فاز دیگری باشد.");
      return;
    }
    if (!input.phaseId) throw new ProductTimelineError(400, "برای قابلیت یا لاگ، فاز مربوط را انتخاب کن.");
    if (input.phaseId === entryId) throw new ProductTimelineError(400, "آیتم نمی‌تواند فاز خودش باشد.");
    const phase = await this.getRow(input.phaseId);
    if (phase.kind !== "phase") throw new ProductTimelineError(400, "فاز انتخاب‌شده معتبر نیست.");
  }

  async create(input: ProductTimelineInput): Promise<ProductTimelineEntry> {
    await this.validatePhase(input);
    const now = new Date();
    const [row] = await this.database
      .insert(productTimelineEntries)
      .values({ ...input, id: randomUUID(), publishedAt: null, createdAt: now, updatedAt: now })
      .returning();
    return toEntry(row);
  }

  async update(id: string, input: ProductTimelineInput): Promise<ProductTimelineEntry> {
    const current = await this.getRow(id);
    await this.validatePhase(input, id);
    if (current.publishedAt && input.kind !== "phase" && input.storySlides.length === 0) {
      throw new ProductTimelineError(400, "برای آیتم منتشرشده دست‌کم یک اسلاید استوری لازم است.");
    }
    if (current.publishedAt && input.kind === "release" && input.status !== "completed") {
      throw new ProductTimelineError(400, "لاگ منتشرشده باید وضعیت انجام‌شده داشته باشد.");
    }
    if (current.kind === "phase" && input.kind !== "phase") {
      const [child] = await this.database
        .select({ id: productTimelineEntries.id })
        .from(productTimelineEntries)
        .where(eq(productTimelineEntries.phaseId, id))
        .limit(1);
      if (child) throw new ProductTimelineError(409, "فاز دارای آیتم است و نوع آن قابل تغییر نیست.");
    }
    const [row] = await this.database
      .update(productTimelineEntries)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(productTimelineEntries.id, id))
      .returning();
    return toEntry(row);
  }

  async publish(id: string): Promise<ProductTimelineEntry> {
    const current = await this.getRow(id);
    if (current.kind === "release" && current.status !== "completed") {
      throw new ProductTimelineError(400, "لاگ انتشار فقط برای تغییر انجام‌شده منتشر می‌شود.");
    }
    if (current.kind !== "phase" && current.storySlides.length === 0) {
      throw new ProductTimelineError(400, "برای انتشار قابلیت یا لاگ، دست‌کم یک اسلاید استوری بساز.");
    }
    if (current.phaseId) {
      const phase = await this.getRow(current.phaseId);
      if (!phase.publishedAt) throw new ProductTimelineError(409, "ابتدا فاز مربوط را منتشر کن.");
    }
    if (current.publishedAt) return toEntry(current);
    const now = new Date();
    const [row] = await this.database
      .update(productTimelineEntries)
      .set({ publishedAt: now, updatedAt: now })
      .where(eq(productTimelineEntries.id, id))
      .returning();
    return toEntry(row);
  }

  async unpublish(id: string): Promise<ProductTimelineEntry> {
    const current = await this.getRow(id);
    if (current.kind === "phase") {
      const [publishedChild] = await this.database
        .select({ id: productTimelineEntries.id })
        .from(productTimelineEntries)
        .where(and(eq(productTimelineEntries.phaseId, id), isNotNull(productTimelineEntries.publishedAt)))
        .limit(1);
      if (publishedChild) throw new ProductTimelineError(409, "ابتدا آیتم‌های منتشرشدهٔ این فاز را از انتشار خارج کن.");
    }
    const [row] = await this.database
      .update(productTimelineEntries)
      .set({ publishedAt: null, updatedAt: new Date() })
      .where(eq(productTimelineEntries.id, id))
      .returning();
    return toEntry(row);
  }

  async remove(id: string): Promise<void> {
    const current = await this.getRow(id);
    if (current.publishedAt) throw new ProductTimelineError(409, "ابتدا آیتم را از انتشار خارج کن.");
    if (current.kind === "phase") {
      const [child] = await this.database
        .select({ id: productTimelineEntries.id })
        .from(productTimelineEntries)
        .where(eq(productTimelineEntries.phaseId, id))
        .limit(1);
      if (child) throw new ProductTimelineError(409, "فاز دارای آیتم است و قابل حذف نیست.");
    }
    await this.database.delete(productTimelineEntries).where(eq(productTimelineEntries.id, id));
  }
}
