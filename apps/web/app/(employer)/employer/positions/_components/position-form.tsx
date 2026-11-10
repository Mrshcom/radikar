"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const positionSchema = z.object({
  title: z.string().trim().min(2, "عنوان شغلی را وارد کن.").max(160, "عنوان شغلی بیش از حد طولانی است."),
  description: z
    .string()
    .trim()
    .min(10, "شرح موقعیت باید حداقل ۱۰ کاراکتر باشد.")
    .max(12_000, "شرح موقعیت بیش از حد طولانی است."),
});

export type PositionValues = z.infer<typeof positionSchema>;

type PositionFormProps = {
  mode: "create" | "edit";
  initialValues?: PositionValues;
  isPending: boolean;
  error: Error | null;
  onSubmit: (values: PositionValues) => Promise<void> | void;
};

export function PositionForm({ mode, initialValues, isPending, error, onSubmit }: PositionFormProps) {
  const form = useForm<PositionValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: initialValues ?? { title: "", description: "" },
  });

  return (
    <form
      id={mode === "create" ? "employer-position-create-form" : undefined}
      className="space-y-6 rounded-[22px] border border-[#dfe9e3] bg-white p-6 sm:p-8"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div>
        <h2 className="m-0 text-lg font-bold text-[#19312f]">
          {mode === "create" ? "اطلاعات پایهٔ پوزیشن" : "مشخصات پوزیشن"}
        </h2>
        <p className="mb-0 mt-1 text-xs leading-6 text-[#75877d]">
          عنوان و شرایط ضروری را روشن بنویس؛ بررسی رزومه‌ها دقیقاً براساس همین شرح انجام می‌شود.
        </p>
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-[#345348]" htmlFor="employer-position-title">
          عنوان شغلی
        </label>
        <input
          id="employer-position-title"
          className="block min-h-12 w-full rounded-xl border border-[#dce8df] bg-white px-4 py-3 text-sm outline-none focus:border-[#0f7b62]"
          {...form.register("title")}
          placeholder="مثلاً مدیر محصول"
          aria-invalid={Boolean(form.formState.errors.title)}
        />
        {form.formState.errors.title && (
          <p role="alert" className="mb-0 mt-1 text-xs text-red-600">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-[#345348]" htmlFor="employer-position-description">
          شرح موقعیت و شرایط موردنیاز
        </label>
        <textarea
          id="employer-position-description"
          className="block min-h-56 w-full resize-y rounded-xl border border-[#dce8df] bg-white px-4 py-3 text-sm leading-8 outline-none focus:border-[#0f7b62]"
          {...form.register("description")}
          placeholder="مسئولیت‌ها، مهارت‌ها، شهر، نوع همکاری و شرایط ضروری را واضح بنویس..."
          aria-invalid={Boolean(form.formState.errors.description)}
        />
        {form.formState.errors.description && (
          <p role="alert" className="mb-0 mt-1 text-xs text-red-600">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="m-0 text-sm text-red-600">
          {error.message}
        </p>
      )}
      {mode === "edit" && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            className="rounded-xl px-4 py-3 text-sm font-bold text-[#647a70] no-underline"
            href="/employer/positions"
          >
            انصراف
          </Link>
          <button
            disabled={isPending}
            className="min-h-11 rounded-xl bg-[#0f7b62] px-6 text-sm font-bold text-white disabled:opacity-50"
            type="submit"
          >
            {isPending ? "در حال ذخیره..." : "ذخیرهٔ تغییرات"}
          </button>
        </div>
      )}
    </form>
  );
}
