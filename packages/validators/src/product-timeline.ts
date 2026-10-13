import { z } from "zod";

const safeAppPath = z
  .string()
  .trim()
  .max(200)
  .refine((value) => value.startsWith("/") && !value.startsWith("//") && !/[\\\r\n]/.test(value), {
    message: "لینک باید مسیر داخلی امن باشد.",
  });
const safeCtaPath = safeAppPath.refine((value) => !/^\/(?:admin|api|v1)(?:\/|$)/.test(value), {
  message: "لینک دمو باید به یکی از صفحه‌های کاربر اشاره کند.",
});
const optionalText = (schema: z.ZodString) => z.union([z.literal(""), schema]).transform((value) => value || undefined);

export const productStorySlideSchema = z
  .object({
    title: z.string().trim().min(2).max(100),
    body: z.string().trim().min(5).max(600),
    imagePath: optionalText(
      safeAppPath.refine((value) => value.startsWith("/illustrations/") || value.startsWith("/images/"), {
        message: "تصویر باید از فایل‌های تصویری پروژه باشد.",
      }),
    ).optional(),
    ctaLabel: optionalText(z.string().trim().min(2).max(40)).optional(),
    ctaHref: optionalText(safeCtaPath).optional(),
  })
  .refine((value) => Boolean(value.ctaLabel) === Boolean(value.ctaHref), {
    message: "عنوان و مسیر دکمهٔ استوری باید با هم ثبت شوند.",
  });

export const productTimelineInputSchema = z.object({
  kind: z.enum(["phase", "feature", "release"]),
  phaseId: z.union([z.uuid(), z.null(), z.literal("")]).transform((value) => value || null),
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(8).max(600),
  status: z.enum(["planned", "building", "completed"]),
  sortOrder: z.number().int().min(0).max(10_000),
  storySlides: z.array(productStorySlideSchema).max(8),
});
