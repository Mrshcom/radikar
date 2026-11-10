"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/app/_components/toast";
import { useEmployerProfile, useUpdateEmployerProfile } from "@/lib/employer";

const schema = z.object({
  companyName: z.string().trim().min(2, "نام شرکت باید حداقل ۲ حرف باشد.").max(120, "نام شرکت خیلی طولانی است."),
});
type FormValues = z.infer<typeof schema>;

export default function EmployerProfilePage() {
  const profile = useEmployerProfile();
  const updateProfile = useUpdateEmployerProfile();
  const notify = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { companyName: "" } });

  useEffect(() => {
    if (profile.data?.profile) reset({ companyName: profile.data.profile.companyName });
  }, [profile.data?.profile, reset]);

  const submit = handleSubmit(async (values) => {
    await updateProfile.mutateAsync(values);
    reset(values);
    notify("اطلاعات شرکت با موفقیت ذخیره شد.");
  });

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <Link
        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#587069] no-underline hover:text-[#0f7b62]"
        href="/employer/account-center"
      >
        <ArrowRight aria-hidden="true" size={17} /> بازگشت به مرکز کارفرما
      </Link>
      <header>
        <h1 className="m-0 text-[26px] font-black text-[#19312f] sm:text-[30px]">پروفایل شرکت</h1>
        <p className="mb-0 mt-2 text-sm leading-7 text-[#6c7f79]">
          نامی که در پوزیشن‌ها و ارتباط با نامزدها نمایش داده می‌شود.
        </p>
      </header>

      <form
        className="mt-6 rounded-[22px] border border-[#dbe8e1] bg-white p-5 shadow-[0_12px_32px_rgba(24,64,53,.06)] sm:p-7"
        onSubmit={submit}
      >
        <div className="flex items-center gap-3 border-b border-[#edf2ee] pb-5">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#e7f4ec] text-[#0f7b62]">
            <Building2 aria-hidden="true" size={24} />
          </span>
          <div>
            <h2 className="m-0 text-base font-black text-[#19312f]">اطلاعات کسب‌وکار</h2>
            <p className="mb-0 mt-1 text-xs text-[#7b8b86]">بعداً می‌توانی جزئیات بیشتری به پروفایل شرکت اضافه کنی.</p>
          </div>
        </div>

        <label className="mt-6 block text-sm font-bold text-[#294a40]" htmlFor="company-name">
          نام شرکت یا مجموعه
        </label>
        <input
          className="mt-2 min-h-12 w-full rounded-[13px] border border-[#d9e5de] bg-[#fbfdfc] px-4 text-sm text-[#19312f] outline-none transition focus:border-[#0f7b62] focus:ring-3 focus:ring-[#dcefe7]"
          id="company-name"
          placeholder="مثلاً رادیکار"
          {...register("companyName")}
        />
        {errors.companyName && (
          <p className="mb-0 mt-2 text-xs font-semibold text-[#b84936]">{errors.companyName.message}</p>
        )}
        {updateProfile.error && (
          <p className="mb-0 mt-3 text-xs font-semibold text-[#b84936]">{updateProfile.error.message}</p>
        )}

        <button
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-[13px] bg-[#0f7b62] px-6 text-sm font-bold text-white transition hover:bg-[#0b6954] disabled:cursor-not-allowed disabled:opacity-55"
          disabled={!isDirty || updateProfile.isPending || profile.isPending}
          type="submit"
        >
          {updateProfile.isPending ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
          ) : (
            <Save aria-hidden="true" size={18} />
          )}
          ذخیره تغییرات
        </button>
      </form>
    </div>
  );
}
