"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, LockKeyhole, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { employerKeys, useEmployerPosition, type EmployerPosition } from "@/lib/employer";
import { DeleteConfirmModal, SectionTitle } from "@/app/(panel)/_components/ui";
import { PositionForm, type PositionValues } from "../../_components/position-form";
import { availableHiringStep, HiringWorkflow } from "../../_components/hiring-workflow";
import { useState } from "react";

export default function EditEmployerPositionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const detail = useEmployerPosition(id);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const update = useMutation({
    mutationFn: (input: PositionValues) =>
      apiRequest<EmployerPosition>(`/api/employer/positions/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: employerKeys.positions });
      router.push(`/employer/positions/${id}`);
    },
  });
  const remove = useMutation({
    mutationFn: () => apiRequest(`/api/employer/positions/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: employerKeys.positions });
      router.replace("/employer/positions");
    },
  });

  if (detail.isLoading) return <p className="text-sm text-[#71847a]">در حال دریافت پوزیشن...</p>;
  if (detail.error || !detail.data)
    return (
      <p role="alert" className="text-sm text-red-600">
        {detail.error?.message || "پوزیشن پیدا نشد."}
      </p>
    );

  const { position } = detail.data;
  const hasInvitations = detail.data.candidates.some((candidate) => candidate.invitationStatus !== "not_invited");
  const availableStep = availableHiringStep(position, detail.data.candidates);
  const openStep = (step: 2 | 3 | 4) => router.push(`/employer/positions/${id}?step=${step}`);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0f7b62] no-underline"
        href={`/employer/positions/${id}`}
      >
        <ArrowRight size={16} /> بازگشت به پوزیشن
      </Link>
      <SectionTitle title="ویرایش پوزیشن کاری" description="عنوان و شرایط را پیش از شروع پایش یا ساخت دعوت اصلاح کن." />
      <HiringWorkflow
        currentStep={1}
        availableStep={availableStep}
        onStepChange={(step) => {
          if (step !== 1) openStep(step);
        }}
      />
      {position.screeningStatus === "not_started" && !hasInvitations ? (
        <>
          <PositionForm
            mode="edit"
            initialValues={{ title: position.title, description: position.description }}
            isPending={update.isPending}
            error={update.error}
            onSubmit={(values) => update.mutate(values)}
          />
          <nav aria-label="جابجایی بین مراحل جذب" className="flex items-center justify-between px-1 pb-2 sm:px-2">
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#cfe3d8] px-5 text-sm font-bold text-[#0f7b62] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowRight size={17} /> مرحلهٔ قبل
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0f7b62] px-5 text-sm font-bold text-white"
              onClick={() => openStep(2)}
            >
              مرحلهٔ بعد <ArrowLeft size={17} />
            </button>
          </nav>
          <section className="rounded-[22px] border border-[#f0d8d3] bg-[#fffafa] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 text-sm font-black text-[#873d37]">حذف پوزیشن</h2>
              <button
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-[#e4bdb7] bg-white px-4 text-xs font-bold text-[#a6443b] disabled:opacity-50"
                type="button"
                disabled={remove.isPending}
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={16} /> حذف پوزیشن
              </button>
            </div>
            <p className="mb-0 mt-3 text-xs leading-7 text-[#7d625d]">
              پوزیشن و رزومه‌های افزوده‌شده به آن حذف می‌شوند؛ نسخهٔ اصلی رزومه‌ها در بانک رزومه باقی می‌ماند.
            </p>
            {remove.error && (
              <p role="alert" className="mb-0 mt-3 text-xs text-[#b0463d]">
                {remove.error.message}
              </p>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-[22px] border border-[#e9ded0] bg-white p-6 sm:p-8">
          <LockKeyhole className="mb-3 text-[#a16d36]" size={28} />
          <h2 className="m-0 text-lg font-bold text-[#19312f]">ویرایش این پوزیشن قفل شده است</h2>
          <p className="mb-5 mt-2 text-sm leading-8 text-[#647a70]">
            پایش رزومه‌ها یا دعوت نامزدها برای این پوزیشن شروع شده و نتیجه‌ها و دعوت‌ها به شرح فعلی وابسته‌اند. برای
            شرایط جدید، یک پوزیشن تازه بساز.
          </p>
          <Link
            className="inline-flex min-h-10 items-center rounded-xl bg-[#0f7b62] px-5 text-xs font-bold text-white no-underline"
            href="/employer/positions/new"
          >
            افزودن پوزیشن جدید
          </Link>
        </section>
      )}
      {deleteOpen && (
        <DeleteConfirmModal
          itemName={position.title}
          description="این پوزیشن و همهٔ رزومه‌های افزوده‌شده به آن حذف می‌شوند. رزومه‌های اصلی بانک رزومه حفظ خواهند شد. این کار قابل بازگشت نیست."
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => remove.mutate()}
        />
      )}
    </div>
  );
}
