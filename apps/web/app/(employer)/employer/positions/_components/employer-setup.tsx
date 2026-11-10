"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BriefcaseBusiness } from "lucide-react";
import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import { employerKeys } from "@/lib/employer";

const profileSchema = z.object({ companyName: z.string().trim().min(2, "نام شرکت را وارد کن.").max(120) });
type ProfileValues = z.infer<typeof profileSchema>;

export function EmployerSetup() {
  const client = useQueryClient();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { companyName: "" },
  });
  const createProfile = useMutation({
    mutationFn: (input: ProfileValues) =>
      apiRequest("/api/employer/profile", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: async () => client.invalidateQueries({ queryKey: employerKeys.profile }),
  });

  return (
    <section className="mx-auto max-w-xl rounded-[22px] border border-[#dfe9e3] bg-white p-6 sm:p-8">
      <BriefcaseBusiness className="mb-4 text-[#0f7b62]" size={30} />
      <h1 className="mb-2 text-2xl font-black">راه‌اندازی فضای کارفرما</h1>
      <p className="mb-6 text-sm leading-7 text-[#647a70]">
        ابتدا نام شرکت را ثبت کن تا ساخت پوزیشن‌های کاری فعال شود. این نام فعلاً خوداظهاری است و نشان تأیید شرکت ندارد.
      </p>
      <form className="space-y-4" onSubmit={form.handleSubmit((input) => createProfile.mutate(input))}>
        <div>
          <label className="mb-2 block text-sm font-bold text-[#345348]" htmlFor="employer-company-name">
            نام شرکت یا مجموعه
          </label>
          <input
            id="employer-company-name"
            className="block w-full rounded-xl border border-[#dce8df] bg-white px-4 py-3 text-sm outline-none focus:border-[#0f7b62]"
            {...form.register("companyName")}
            placeholder="مثلاً شرکت نمونه"
            aria-invalid={Boolean(form.formState.errors.companyName)}
          />
          {form.formState.errors.companyName && (
            <p role="alert" className="mb-0 mt-1 text-xs text-red-600">
              {form.formState.errors.companyName.message}
            </p>
          )}
        </div>
        {createProfile.error && (
          <p role="alert" className="text-xs text-red-600">
            {createProfile.error.message}
          </p>
        )}
        <button
          disabled={createProfile.isPending}
          className="min-h-11 rounded-xl bg-[#0f7b62] px-5 text-sm font-bold text-white disabled:opacity-50"
          type="submit"
        >
          {createProfile.isPending ? "در حال ثبت..." : "ثبت فضای کارفرما"}
        </button>
      </form>
    </section>
  );
}
