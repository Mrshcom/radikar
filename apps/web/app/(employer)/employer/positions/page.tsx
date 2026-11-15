"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, ChevronLeft, Pencil, Plus } from "lucide-react";
import { positionWorkflowBadge, useEmployerPositions, useEmployerProfile } from "@/lib/employer";
import { SectionTitle } from "@/app/(panel)/_components/ui";
import { HoverTooltip } from "@/app/(panel)/_components/hover-tooltip";

export default function EmployerPositionsPage() {
  const router = useRouter();
  const profile = useEmployerProfile();
  const positions = useEmployerPositions("all");

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
        <div className="grid gap-3 lg:grid-cols-2">
          {positions.data.map((position) => {
            const canEdit = position.screeningStatus === "not_started" && (position.workflowStage ?? 1) === 1;
            return (
            <article
              className="group flex h-full cursor-pointer flex-col rounded-[20px] border border-[#dfe9e3] bg-linear-to-br from-white to-[#f8fcf9] p-4 shadow-[0_3px_14px_rgba(21,62,45,.035)] transition duration-200 hover:border-[#a9d4bb] hover:shadow-[0_12px_28px_rgba(15,123,98,.09)] sm:p-5"
              key={position.id}
              onClick={() => router.push(`/employer/positions/${position.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="m-0 truncate text-lg font-bold text-[#19312f]" title={position.title}>
                    {position.title}
                  </h2>
                  <p className="mb-0 mt-1 text-[10px] text-[#71887a]">{position.companyName}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
                    position.closedAt
                      ? position.closureReason === "hired"
                        ? "bg-[#e5f4ec] text-[#0f7b62]"
                        : "bg-[#f1f4f2] text-[#63766f]"
                      : positionWorkflowBadge(position).className
                  }`}
                >
                  {position.closedAt ? `بسته‌شده — ${position.closureReason === "hired" ? "استخدام شد" : "متوقف شد"}` : positionWorkflowBadge(position).label}
                </span>
              </div>
              <HoverTooltip
                as="div"
                className="mt-3 block min-w-0"
                content={position.description}
                contentClassName="!max-w-[min(420px,calc(100vw-24px))] !whitespace-normal text-right leading-6"
              >
                <p className="m-0 line-clamp-1 text-xs leading-6 text-[#647a70]">{position.description}</p>
              </HoverTooltip>
              <div className="mt-auto pt-4">
                <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-[#e6eee9] pt-3">
                  {canEdit ? (
                    <Link
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#647a70] no-underline"
                      href={`/employer/positions/${position.id}/edit`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Pencil size={14} /> ویرایش
                    </Link>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  <Link
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#0f7b62] no-underline transition hover:text-[#095f4c] hover:no-underline"
                    href={`/employer/positions/${position.id}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    ادامهٔ فرایند جذب <ChevronLeft size={15} />
                  </Link>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
