"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { SectionBackLink, SectionTitle } from "@/app/(panel)/_components/ui";
import { employerKeys, useEmployerProfile, type EmployerPosition } from "@/lib/employer";
import { EmployerSetup } from "../_components/employer-setup";
import { PositionForm, type PositionValues } from "../_components/position-form";
import { HiringWorkflow } from "../_components/hiring-workflow";

export default function NewEmployerPositionPage() {
  const router = useRouter();
  const client = useQueryClient();
  const profile = useEmployerProfile();
  const create = useMutation({
    mutationFn: (input: PositionValues) =>
      apiRequest<EmployerPosition>("/api/employer/positions", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: async (position) => {
      await client.invalidateQueries({ queryKey: employerKeys.positions });
      router.push(`/employer/positions/${position.id}`);
    },
  });

  if (profile.isLoading) return <p className="text-sm text-[#71847a]">در حال آماده‌سازی فضای کارفرما...</p>;
  if (profile.error)
    return (
      <p role="alert" className="text-sm text-red-600">
        {profile.error.message}
      </p>
    );
  if (!profile.data?.profile) return <EmployerSetup />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionTitle
        title="افزودن پوزیشن کاری"
        description={`ابتدا اطلاعات پوزیشن ${profile.data.profile.companyName} را ثبت کن؛ در قدم بعد مستقیم رزومه‌ها را اضافه می‌کنی.`}
        leading={<SectionBackLink href="/employer/positions" label="بازگشت به پوزیشن‌های من" />}
      />
      <HiringWorkflow currentStep={1} />
      <PositionForm
        mode="create"
        isPending={create.isPending}
        error={create.error}
        onSubmit={(values) => create.mutate(values)}
      />
      <nav
        aria-label="جابجایی بین مراحل جذب"
        className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2 sm:px-2"
      >
        <button
          type="button"
          disabled
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#cfe3d8] px-5 text-sm font-bold text-[#0f7b62] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowRight size={17} /> مرحلهٔ قبل
        </button>
        <button
          type="submit"
          form="employer-position-create-form"
          disabled={create.isPending}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0f7b62] px-5 text-sm font-bold text-white disabled:opacity-50"
        >
          {create.isPending ? "در حال ساخت..." : "مرحلهٔ بعد"} <ArrowLeft size={17} />
        </button>
      </nav>
    </div>
  );
}
