"use client";

import Link from "next/link";
import { BriefcaseBusiness, ChevronLeft, Pencil, Plus } from "lucide-react";
import { positionWorkflowBadge, useEmployerPositions, useEmployerProfile } from "@/lib/employer";
import { SectionTitle } from "@/app/(panel)/_components/ui";

export default function EmployerPositionsPage() {
  const profile = useEmployerProfile();
  const positions = useEmployerPositions();

  return (
    <div className="space-y-7">
      <SectionTitle
        title="پوزیشن‌های من"
        description="موقعیت‌های شغلی، رزومه‌ها و نتیجهٔ پایش هر پوزیشن را جداگانه مدیریت کن."
        action={
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0f7b62] px-5 text-sm font-bold text-white no-underline"
            href="/employer/positions/new"
          >
            <Plus size={18} /> افزودن پوزیشن کاری
          </Link>
        }
      />

      {profile.isLoading || positions.isLoading ? (
        <p className="text-sm text-[#71847a]">در حال دریافت پوزیشن‌ها...</p>
      ) : profile.error || positions.error ? (
        <p role="alert" className="text-sm text-red-600">
          {profile.error?.message || positions.error?.message}
        </p>
      ) : !profile.data?.profile ? (
        <section className="rounded-[22px] border border-dashed border-[#cbded1] bg-white p-8 text-center">
          <BriefcaseBusiness className="mx-auto mb-3 text-[#0f7b62]" size={30} />
          <h2 className="m-0 text-lg font-bold text-[#19312f]">ابتدا فضای کارفرما را راه‌اندازی کن</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-[#647a70]">
            نام شرکت را ثبت کن و بعد اولین پوزیشن کاری را بساز.
          </p>
          <Link className="mt-3 inline-flex text-sm font-bold text-[#0f7b62]" href="/employer/positions/new">
            شروع راه‌اندازی
          </Link>
        </section>
      ) : !positions.data?.length ? (
        <section className="rounded-[22px] border border-dashed border-[#cbded1] bg-white p-8 text-center">
          <BriefcaseBusiness className="mx-auto mb-3 text-[#0f7b62]" size={30} />
          <h2 className="m-0 text-lg font-bold text-[#19312f]">هنوز پوزیشنی ثبت نشده است</h2>
          <p className="mt-2 text-sm text-[#647a70]">اولین پوزیشن را بساز تا ورود رزومه‌ها را شروع کنی.</p>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {positions.data.map((position) => {
            const canEdit = position.screeningStatus === "not_started" && (position.workflowStage ?? 1) === 1;
            return (
            <article className="rounded-[20px] border border-[#dfe9e3] bg-white p-5 sm:p-6" key={position.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="m-0 truncate text-lg font-bold text-[#19312f]" title={position.title}>
                    {position.title}
                  </h2>
                  <p className="mb-0 mt-1 text-xs text-[#71887a]">{position.companyName}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${positionWorkflowBadge(position).className}`}
                >
                  {positionWorkflowBadge(position).label}
                </span>
              </div>
              <p className="mt-4 line-clamp-2 min-h-12 text-xs leading-6 text-[#647a70]">{position.description}</p>
              <div className="mt-5 flex w-full flex-wrap items-center justify-between gap-4 border-t border-[#edf1ec] pt-4">
                {canEdit ? (
                  <Link
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#647a70] no-underline"
                    href={`/employer/positions/${position.id}/edit`}
                  >
                    <Pencil size={14} /> ویرایش
                  </Link>
                ) : (
                  <span aria-hidden="true" />
                )}
                <Link
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0f7b62] no-underline"
                  href={`/employer/positions/${position.id}`}
                >
                  ادامهٔ فرایند جذب <ChevronLeft size={15} />
                </Link>
              </div>
            </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
