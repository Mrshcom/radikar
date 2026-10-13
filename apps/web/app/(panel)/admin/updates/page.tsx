"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Eye, FilePlus2, Pencil, Plus, Send, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { productTimelineInputSchema } from "@radikar/validators";
import type { ProductTimelineEntry, ProductTimelineKind } from "@radikar/shared-types";
import type { z } from "zod";
import { useAuth } from "@/app/_components/auth";
import { useToast } from "@/app/_components/toast";
import {
  useAdminProductTimeline,
  useDeleteProductTimeline,
  useSaveProductTimeline,
  useSetProductTimelinePublication,
} from "@/lib/product-timeline";
import { ConfirmActionModal, Modal } from "../../_components/ui";
import { PanelPageTitle } from "../../_components/panel-page-title";
import { ProductStoryViewer } from "../../updates/product-story-viewer";

type FormInput = z.input<typeof productTimelineInputSchema>;
type FormOutput = z.output<typeof productTimelineInputSchema>;

const kindLabels: Record<ProductTimelineKind, string> = {
  phase: "فاز",
  feature: "قابلیت",
  release: "لاگ انتشار",
};
const inputClass =
  "min-h-10 w-full rounded-xl border border-[#dce7df] bg-white px-3 text-[12px] text-[#24483e] outline-none focus:border-[#0f7b62]";
const labelClass = "grid gap-1.5 text-[11px] font-bold text-[#315449]";

function emptyForm(kind: ProductTimelineKind = "phase"): FormInput {
  return {
    kind,
    phaseId: null,
    title: "",
    summary: "",
    status: "planned",
    sortOrder: 0,
    storySlides: [],
  };
}

export default function AdminProductUpdatesPage() {
  const { user } = useAuth();
  const notify = useToast();
  const timeline = useAdminProductTimeline(user?.role === "admin" || user?.role === "superadmin");
  const save = useSaveProductTimeline();
  const publish = useSetProductTimelinePublication();
  const remove = useDeleteProductTimeline();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductTimelineEntry | null>(null);
  const [preview, setPreview] = useState<ProductTimelineEntry | null>(null);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(productTimelineInputSchema),
    defaultValues: emptyForm(),
  });
  const slides = useFieldArray({ control: form.control, name: "storySlides" });
  const kind = useWatch({ control: form.control, name: "kind" });
  const items = timeline.data?.items ?? [];
  const phases = items.filter((item) => item.kind === "phase");

  const openCreate = (newKind: ProductTimelineKind) => {
    setEditingId(null);
    form.reset(emptyForm(newKind));
    setEditorOpen(true);
  };
  const openEdit = (item: ProductTimelineEntry) => {
    setEditingId(item.id);
    form.reset({
      kind: item.kind,
      phaseId: item.phaseId,
      title: item.title,
      summary: item.summary,
      status: item.status,
      sortOrder: item.sortOrder,
      storySlides: item.storySlides.map((slide) => ({
        ...slide,
        imagePath: slide.imagePath ?? "",
        ctaLabel: slide.ctaLabel ?? "",
        ctaHref: slide.ctaHref ?? "",
      })),
    });
    setEditorOpen(true);
  };
  const submit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ id: editingId ?? undefined, input: values });
      notify(editingId ? "آیتم به‌روزرسانی شد." : "پیش‌نویس ساخته شد.");
      setEditorOpen(false);
    } catch (error) {
      notify(error instanceof Error ? error.message : "ذخیره‌سازی ناموفق بود.", "error");
    }
  });
  const changePublication = async (item: ProductTimelineEntry) => {
    try {
      await publish.mutateAsync({ id: item.id, published: !item.publishedAt });
      notify(item.publishedAt ? "آیتم از انتشار خارج شد." : "آیتم منتشر شد.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "تغییر وضعیت انتشار ناموفق بود.", "error");
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PanelPageTitle
          title="مدیریت مسیر محصول"
          description="فازها، قابلیت‌ها، لاگ‌های انتشار و اسلایدهای استوری را پیش از نمایش به کاربر آماده و منتشر کن."
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openCreate("phase")}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#b8d7c6] bg-white px-4 text-[11px] font-bold text-[#0f7b62]"
          >
            <Plus size={16} /> فاز تازه
          </button>
          <button
            type="button"
            onClick={() => openCreate("feature")}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0f7b62] px-4 text-[11px] font-bold text-white hover:bg-[#09664f]"
          >
            <FilePlus2 size={16} /> قابلیت یا لاگ
          </button>
        </div>
      </div>

      <div className="rounded-[18px] border border-[#dce9e0] bg-[#f3faf5] px-5 py-4 text-[11px] leading-7 text-[#4b6b5d]">
        فقط آیتم‌های منتشرشده در تایم‌لاین کاربر دیده می‌شوند. استوری قابلیت و لاگ از زمان انتشار، ۷ روز در «تازه‌ها»
        است و بعد همچنان از کنار همان آیتم قابل بازبینی می‌ماند. تاریخ انتشار را سیستم ثبت می‌کند.
      </div>

      {timeline.isPending ? (
        <div role="status" className="rounded-xl bg-white p-8 text-center text-[12px] text-[#71817d]">
          در حال دریافت محتوا...
        </div>
      ) : timeline.isError ? (
        <div className="rounded-xl border border-[#efc9c5] bg-[#fff7f5] p-6 text-[12px] text-[#a13f37]">
          دریافت محتوا ناموفق بود.{" "}
          <button type="button" className="underline" onClick={() => void timeline.refetch()}>
            تلاش دوباره
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#cbded1] bg-white p-10 text-center">
          <CalendarDays className="mx-auto text-[#79ac91]" size={32} />
          <h2 className="mb-0 mt-3 text-[15px] text-[#24483e]">هنوز فازی ثبت نشده است</h2>
          <p className="mb-0 mt-2 text-[11px] text-[#71817d]">
            اول فاز را بساز؛ سپس قابلیت‌ها و لاگ‌ها را به آن وصل کن.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-[18px] border border-[#e0e9e2] bg-white p-5 shadow-[0_8px_24px_rgba(25,49,47,.04)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="rounded-full bg-[#e8f5ee] px-2.5 py-1 font-bold text-[#0f7b62]">
                      {kindLabels[item.kind]}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 ${item.publishedAt ? "bg-[#e2f4e9] text-[#17664d]" : "bg-[#f1f3f1] text-[#71817d]"}`}
                    >
                      {item.publishedAt ? "منتشرشده" : "پیش‌نویس"}
                    </span>
                    {item.phaseId && (
                      <span className="text-[#81918a]">
                        در {phases.find((phase) => phase.id === item.phaseId)?.title || "فاز نامشخص"}
                      </span>
                    )}
                  </div>
                  <h2 className="m-0 text-[15px] font-black text-[#19312f]">{item.title}</h2>
                  <p className="mb-0 mt-1 text-[11px] leading-6 text-[#6a7c72]">{item.summary}</p>
                  {item.kind !== "phase" && (
                    <span className="mt-2 block text-[10px] text-[#81918a]">
                      {item.storySlides.length.toLocaleString("fa-IR")} اسلاید استوری
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.storySlides.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreview(item)}
                      className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#dce8e0] px-3 text-[10px] font-semibold text-[#4e7866]"
                    >
                      <Eye size={14} /> استوری
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#dce8e0] px-3 text-[10px] font-semibold text-[#4e7866]"
                  >
                    <Pencil size={14} /> ویرایش
                  </button>
                  <button
                    type="button"
                    disabled={publish.isPending}
                    onClick={() => void changePublication(item)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#0f7b62] px-3 text-[10px] font-semibold text-white disabled:opacity-50"
                  >
                    {item.publishedAt ? <Undo2 size={14} /> : <Send size={14} />}
                    {item.publishedAt ? "لغو انتشار" : "انتشار"}
                  </button>
                  {!item.publishedAt && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="grid size-9 place-items-center rounded-lg border border-[#efcfca] text-[#a54d42]"
                      aria-label={`حذف ${item.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editorOpen && (
        <Modal
          wide
          title={editingId ? "ویرایش آیتم تایم‌لاین" : "آیتم تازه"}
          description="آیتم ابتدا به‌صورت پیش‌نویس ذخیره می‌شود و پس از تأیید جداگانه منتشر خواهد شد."
          showCloseButton
          onClose={() => setEditorOpen(false)}
        >
          <form onSubmit={submit} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                نوع
                <select className={inputClass} {...form.register("kind")}>
                  <option value="phase">فاز</option>
                  <option value="feature">قابلیت</option>
                  <option value="release">لاگ انتشار</option>
                </select>
              </label>
              {kind !== "phase" && (
                <label className={labelClass}>
                  فاز مربوط
                  <select className={inputClass} {...form.register("phaseId")} defaultValue="">
                    <option value="">انتخاب فاز</option>
                    {phases.map((phase) => (
                      <option key={phase.id} value={phase.id}>
                        {phase.title}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.phaseId && (
                    <span className="text-[10px] text-[#a34e45]">فاز معتبر انتخاب کن.</span>
                  )}
                </label>
              )}
              <label className={labelClass}>
                وضعیت
                <select className={inputClass} {...form.register("status")}>
                  <option value="planned">در برنامه</option>
                  <option value="building">در حال ساخت</option>
                  <option value="completed">انجام‌شده</option>
                </select>
              </label>
              <label className={labelClass}>
                ترتیب نمایش
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  max={10000}
                  {...form.register("sortOrder", { valueAsNumber: true })}
                />
              </label>
            </div>
            <label className={labelClass}>
              عنوان
              <input className={inputClass} maxLength={120} {...form.register("title")} />
              {form.formState.errors.title && (
                <span className="text-[10px] text-[#a34e45]">عنوان باید دست‌کم ۳ نویسه باشد.</span>
              )}
            </label>
            <label className={labelClass}>
              خلاصه
              <textarea
                className={`${inputClass} min-h-24 resize-y py-2`}
                maxLength={600}
                {...form.register("summary")}
              />
              {form.formState.errors.summary && (
                <span className="text-[10px] text-[#a34e45]">خلاصه باید دست‌کم ۸ نویسه باشد.</span>
              )}
            </label>

            {kind !== "phase" && (
              <div className="grid gap-3 border-t border-[#e7eee8] pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="m-0 text-[14px] text-[#24483e]">اسلایدهای استوری</h3>
                    <p className="mb-0 mt-1 text-[10px] text-[#71817d]">
                      برای انتشار این آیتم حداقل یک اسلاید لازم است.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={slides.fields.length >= 8}
                    onClick={() => slides.append({ title: "", body: "", imagePath: "", ctaLabel: "", ctaHref: "" })}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#b8d7c6] px-3 text-[10px] font-bold text-[#0f7b62] disabled:opacity-50"
                  >
                    <Plus size={14} /> اسلاید
                  </button>
                </div>
                {slides.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-[14px] border border-[#e1ebe3] bg-[#f8fbf8] p-4">
                    <div className="flex items-center justify-between">
                      <strong className="text-[11px] text-[#315449]">اسلاید {index + 1}</strong>
                      <button type="button" className="text-[10px] text-[#a34e45]" onClick={() => slides.remove(index)}>
                        حذف اسلاید
                      </button>
                    </div>
                    <label className={labelClass}>
                      عنوان اسلاید
                      <input className={inputClass} maxLength={100} {...form.register(`storySlides.${index}.title`)} />
                    </label>
                    <label className={labelClass}>
                      متن اسلاید
                      <textarea
                        className={`${inputClass} min-h-20 resize-y py-2`}
                        maxLength={600}
                        {...form.register(`storySlides.${index}.body`)}
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className={labelClass}>
                        مسیر تصویر (اختیاری)
                        <input
                          className={inputClass}
                          dir="ltr"
                          placeholder="/illustrations/example.png"
                          {...form.register(`storySlides.${index}.imagePath`)}
                        />
                      </label>
                      <label className={labelClass}>
                        عنوان دکمهٔ دمو (اختیاری)
                        <input className={inputClass} {...form.register(`storySlides.${index}.ctaLabel`)} />
                      </label>
                      <label className={labelClass}>
                        مسیر داخلی دمو (اختیاری)
                        <input
                          className={inputClass}
                          dir="ltr"
                          placeholder="/resumes"
                          {...form.register(`storySlides.${index}.ctaHref`)}
                        />
                      </label>
                    </div>
                    {form.formState.errors.storySlides?.[index] && (
                      <span className="text-[10px] text-[#a34e45]">
                        عنوان و متن اسلاید و مسیرهای اختیاری را بررسی کن.
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 border-t border-[#e7eee8] pt-4">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="min-h-10 rounded-xl border border-[#dce7df] px-4 text-[11px] text-[#61776b]"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={save.isPending}
                className="min-h-10 rounded-xl bg-[#0f7b62] px-5 text-[11px] font-bold text-white disabled:opacity-50"
              >
                {save.isPending ? "در حال ذخیره..." : editingId ? "ذخیرهٔ تغییرات" : "ذخیرهٔ پیش‌نویس"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmActionModal
          title="حذف پیش‌نویس"
          description={`«${deleteTarget.title}» حذف شود؟ این کار قابل بازگشت نیست.`}
          confirmLabel="حذف"
          tone="danger"
          pending={remove.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            void remove
              .mutateAsync(deleteTarget.id)
              .then(() => {
                notify("پیش‌نویس حذف شد.");
                setDeleteTarget(null);
              })
              .catch((error: unknown) => notify(error instanceof Error ? error.message : "حذف ناموفق بود.", "error"));
          }}
        />
      )}
      {preview && <ProductStoryViewer key={preview.id} entry={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
