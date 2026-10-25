"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleDashed,
  Clock3,
  Flag,
  GitCommitHorizontal,
  Play,
  Rocket,
  Sparkles,
} from "lucide-react";
import type { ProductTimelineEntry, ProductTimelineStatus } from "@radikar/shared-types";
import { isStoryFresh, useProductTimeline } from "@/lib/product-timeline";
import { PanelPageTitle } from "../_components/panel-page-title";
import { ProductStoryViewer } from "./product-story-viewer";

const statusLabels: Record<ProductTimelineStatus, string> = {
  planned: "در برنامه",
  building: "در حال ساخت",
  completed: "منتشرشده",
};

const statusStyles: Record<ProductTimelineStatus, string> = {
  planned: "border-[#e4ded0] bg-[#f8f5ed] text-[#8b7355]",
  building: "border-[#d6e5dc] bg-[#eaf5ed] text-[#347b62]",
  completed: "border-[#cce9df] bg-[#e5f6ef] text-[#08775d]",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(value),
  );
}

function StatusIcon({ status }: { status: ProductTimelineStatus }) {
  if (status === "completed") return <Check size={14} strokeWidth={2.6} />;
  if (status === "building") return <Clock3 size={14} strokeWidth={2.3} />;
  return <CircleDashed size={14} strokeWidth={2.3} />;
}

function EntryArtwork({ item }: { item: ProductTimelineEntry }) {
  const imagePath = item.storySlides.find((slide) => slide.imagePath)?.imagePath;
  const isRelease = item.kind === "release";

  return (
    <div
      aria-hidden="true"
      className={`relative h-28 w-full overflow-hidden rounded-[18px] sm:h-full sm:min-h-36 ${
        isRelease ? "bg-[#f7eedb]" : "bg-[#e5f2eb]"
      }`}
    >
      {imagePath ? (
        <Image src={imagePath} alt="" fill sizes="(max-width: 640px) 100vw, 180px" className="object-cover" />
      ) : (
        <>
          <span
            className={`absolute -bottom-14 -left-9 size-44 rounded-full border-[22px] ${isRelease ? "border-[#f0dbaa]" : "border-[#c7e8d6]"}`}
          />
          <span
            className={`absolute -right-10 -top-14 size-36 rounded-full border-[18px] ${isRelease ? "border-[#e9d9b8]" : "border-[#d5e9dd]"}`}
          />
          <span
            className={`absolute left-5 top-5 size-3 rounded-full ${isRelease ? "bg-[#d59e54]" : "bg-[#73bd9c]"}`}
          />
          <span className="absolute left-12 top-12 size-1.5 rounded-full bg-white/90" />
          <span
            className={`absolute right-1/2 top-1/2 grid size-16 translate-x-1/2 -translate-y-1/2 place-items-center rounded-[21px] border border-white/70 bg-white/75 shadow-[0_14px_28px_rgba(33,69,55,.09)] ${isRelease ? "rotate-[-8deg] text-[#9c7037]" : "rotate-[8deg] text-[#288466]"}`}
          >
            {isRelease ? <GitCommitHorizontal size={32} strokeWidth={1.6} /> : <Sparkles size={31} strokeWidth={1.6} />}
          </span>
        </>
      )}
    </div>
  );
}

function PhaseArtwork({ index, status }: { index: number; status: ProductTimelineStatus }) {
  return (
    <div aria-hidden="true" className="relative min-h-28 overflow-hidden rounded-[22px] bg-[#e8f3e9] sm:min-h-40">
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(#a5ccb3_1px,transparent_1px)] [background-size:17px_17px]" />
      <div className="absolute -bottom-24 -left-8 size-60 rounded-full border-[28px] border-[#d1e8d7]" />
      <div className="absolute -right-16 -top-20 size-52 rounded-full border-[22px] border-[#d7eadb]" />
      <span className="absolute left-6 top-5 text-[54px] font-black leading-none text-white/80">
        {new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(index + 1)}
      </span>
      <div className="absolute bottom-4 right-6 flex items-center gap-2">
        <span className="size-3 rounded-full bg-[#85baa0] ring-4 ring-white/80" />
        <span className="h-0.5 w-9 rounded-full bg-[#a6cfb7]" />
        <span className="grid size-16 place-items-center rounded-[22px] border border-white bg-white/80 text-[#258469] shadow-[0_12px_25px_rgba(37,91,65,.09)]">
          {status === "completed" ? (
            <Check size={30} />
          ) : status === "building" ? (
            <Rocket size={30} />
          ) : (
            <Flag size={30} />
          )}
        </span>
      </div>
    </div>
  );
}

function TimelineCard({
  item,
  onStory,
  now,
}: {
  item: ProductTimelineEntry;
  onStory: (item: ProductTimelineEntry) => void;
  now: Date;
}) {
  const isFresh = isStoryFresh(item, now);
  return (
    <article className="group relative grid min-w-0 gap-4 rounded-[24px] border border-[#e3eae3] bg-white p-3 shadow-[0_10px_30px_rgba(25,49,47,.035)] transition duration-300 hover:-translate-y-1 hover:border-[#acd5be] hover:shadow-[0_18px_38px_rgba(25,49,47,.1)] sm:grid-cols-[minmax(0,1fr)_148px] sm:p-4">
      <div className="flex min-w-0 flex-col p-1 sm:py-2">
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="font-bold text-[#348369]">{item.kind === "release" ? "لاگ انتشار" : "قابلیت تازه"}</span>
          <span className="size-1 rounded-full bg-[#b9c9bd]" />
          <span className="text-[#84948a]">{statusLabels[item.status]}</span>
          {isFresh && <span className="rounded-full bg-[#fff0c8] px-2 py-0.5 font-bold text-[#926521]">تازه</span>}
        </div>
        <h4 className="mb-0 mt-3 text-[15px] font-extrabold leading-7 text-[#193b32]">{item.title}</h4>
        <p className="mb-0 mt-1 text-[12px] leading-6 text-[#718079]">{item.summary}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
          {item.storySlides.length > 0 ? (
            <button
              type="button"
              onClick={() => onStory(item)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#eaf5ed] px-3.5 text-[11px] font-bold text-[#0b755a] transition hover:bg-[#d6ebde] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62]"
            >
              <Play size={13} fill="currentColor" /> {isFresh ? "دیدن استوری" : "دیدن دوبارهٔ استوری"}{" "}
              <ArrowLeft size={13} />
            </button>
          ) : (
            <span />
          )}
          {item.publishedAt && <time className="text-[10px] text-[#9aa79d]">{formatDate(item.publishedAt)}</time>}
        </div>
      </div>
      <EntryArtwork item={item} />
    </article>
  );
}

export default function ProductUpdatesPage() {
  const timeline = useProductTimeline();
  const [openStory, setOpenStory] = useState<ProductTimelineEntry | null>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const items = timeline.data?.items ?? [];
  const phases = items.filter((item) => item.kind === "phase");
  const updates = items.filter((item) => item.kind !== "phase");
  const freshStories = updates.filter((item) => isStoryFresh(item, now));
  const ungrouped = updates.filter((item) => !item.phaseId);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 pb-12" dir="rtl">
      <PanelPageTitle
        title="مسیر رادیکار"
        description="ببین رادیکار در چه مسیری پیش می‌رود، چه چیزی ساخته شده و هر قابلیت چطور کار می‌کند."
      />

      {timeline.isPending ? (
        <div role="status" className="grid gap-3" aria-label="در حال دریافت تایم‌لاین">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-[26px] bg-[#e9f0ea]" />
          ))}
        </div>
      ) : timeline.isError ? (
        <div className="rounded-[20px] border border-[#efc9c5] bg-[#fff7f5] p-6 text-center text-[12px] text-[#a13f37]">
          دریافت تایم‌لاین ناموفق بود.
          <button type="button" className="mr-2 font-bold underline" onClick={() => void timeline.refetch()}>
            تلاش دوباره
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="relative overflow-hidden rounded-[28px] border border-dashed border-[#cadbd0] bg-[#f7faf6] px-6 py-14 text-center">
          <div
            aria-hidden="true"
            className="absolute -left-16 -top-16 size-52 rounded-full border-[24px] border-[#ebf3e9]"
          />
          <Image
            src="/illustrations/radikar-product-journey-v1.png"
            alt=""
            width={560}
            height={279}
            priority
            className="relative mx-auto h-auto w-full max-w-[500px] scale-x-[-1] object-contain"
          />
          <h2 className="relative mb-0 mt-2 text-[18px] font-black text-[#24483e]">هنوز موردی منتشر نشده است</h2>
          <p className="relative mb-0 mt-2 text-[12px] leading-7 text-[#71817d]">
            با انتشار نخستین فاز یا خبر توسط تیم رادیکار، مسیر محصول از همین‌جا آغاز می‌شود.
          </p>
        </div>
      ) : (
        <>
          {freshStories.length > 0 && (
            <section aria-labelledby="fresh-stories-title" className="border-b border-[#e2ebe3] pb-7">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2
                  id="fresh-stories-title"
                  className="m-0 flex items-center gap-2 text-[15px] font-black text-[#193b32]"
                >
                  <span className="size-2 rounded-full bg-[#e8ad56] ring-4 ring-[#faedcf]" />
                  داستان‌های تازه
                </h2>
                <span className="text-[11px] text-[#829088]">تا ۷ روز تازه‌اند؛ بعداً هم از تایم‌لاین باز می‌شوند</span>
              </div>
              <div className="flex gap-4 overflow-x-auto px-1 py-2">
                {freshStories.map((item) => {
                  const imagePath = item.storySlides.find((slide) => slide.imagePath)?.imagePath;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOpenStory(item)}
                      className="group flex w-24 shrink-0 flex-col items-center gap-2.5 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62]"
                    >
                      <span className="relative grid size-[72px] place-items-center overflow-hidden rounded-[24px] border-[3px] border-white bg-[#e7f3e9] text-[#168269] shadow-[0_0_0_2px_#8cc9a6,0_8px_20px_rgba(30,75,53,.1)] transition group-hover:-translate-y-1 group-hover:shadow-[0_0_0_2px_#42a97b,0_12px_24px_rgba(30,75,53,.17)]">
                        {imagePath ? (
                          <Image src={imagePath} alt="" fill sizes="72px" className="object-cover" />
                        ) : item.kind === "release" ? (
                          <GitCommitHorizontal size={30} strokeWidth={1.6} />
                        ) : (
                          <Sparkles size={30} strokeWidth={1.6} />
                        )}
                      </span>
                      <span className="line-clamp-2 text-[11px] font-bold leading-5 text-[#315348]">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section aria-labelledby="timeline-title">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold tracking-wide text-[#4f9a74]">از برنامه تا انتشار</span>
                <h2 id="timeline-title" className="mb-0 mt-1 text-[21px] font-black text-[#19312f] sm:text-[25px]">
                  خط زمان تغییرات
                </h2>
              </div>
              <p className="m-0 text-[11px] leading-6 text-[#819087]">
                زمان‌بندی فازهای آینده قطعی نیست؛ هر خبر پس از انتشار اینجا قرار می‌گیرد.
              </p>
            </div>
            <div className="relative border-r-2 border-dashed border-[#c7ddcd] pr-6 sm:pr-10">
              {phases.map((phase, index) => {
                const children = updates.filter((item) => item.phaseId === phase.id);
                return (
                  <section key={phase.id} className="relative pb-10 last:pb-0" aria-labelledby={`phase-${phase.id}`}>
                    <span className="absolute -right-[34px] top-8 grid size-5 place-items-center rounded-full border-[5px] border-[#f5faf4] bg-[#1d8d69] shadow-[0_0_0_2px_#85b99c] sm:-right-[50px]" />
                    <div className="overflow-hidden rounded-[28px] border border-[#d8e7dc] bg-[#f8fbf6] p-4 shadow-[0_16px_45px_rgba(33,66,49,.045)] sm:p-5">
                      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="min-w-0 px-1 py-2 sm:p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-black text-[#4d9875]">
                              فاز {new Intl.NumberFormat("fa-IR").format(index + 1)}
                            </span>
                            <span className="h-px w-5 bg-[#b9d1c0]" />
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles[phase.status]}`}
                            >
                              <StatusIcon status={phase.status} /> {statusLabels[phase.status]}
                            </span>
                          </div>
                          <h3
                            id={`phase-${phase.id}`}
                            className="mb-0 mt-4 text-[20px] font-black leading-9 text-[#17382f] sm:text-[24px]"
                          >
                            {phase.title}
                          </h3>
                          <p className="mb-0 mt-1 max-w-xl text-[12px] leading-7 text-[#708177]">{phase.summary}</p>
                          <div className="mt-5 flex items-center gap-1.5 text-[10px] font-bold text-[#6b9a7d]">
                            <GitCommitHorizontal size={14} />
                            {children.length
                              ? `${new Intl.NumberFormat("fa-IR").format(children.length)} تغییر در این فاز`
                              : "جزئیات این فاز به‌زودی"}
                          </div>
                        </div>
                        <PhaseArtwork index={index} status={phase.status} />
                      </div>
                      {children.length > 0 && (
                        <div className="mt-5 grid gap-3 border-t border-[#e1ebe2] pt-5 lg:grid-cols-2">
                          {children.map((item) => (
                            <TimelineCard key={item.id} item={item} onStory={setOpenStory} now={now} />
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
              {ungrouped.length > 0 && (
                <section className="relative pb-1" aria-labelledby="other-updates-title">
                  <span className="absolute -right-[34px] top-7 grid size-5 place-items-center rounded-full border-[5px] border-[#f5faf4] bg-[#d8a562] shadow-[0_0_0_2px_#dfc9a4] sm:-right-[50px]" />
                  <div className="mb-4 flex items-center gap-2">
                    <CalendarDays size={18} className="text-[#b48b57]" />
                    <h3 id="other-updates-title" className="m-0 text-[16px] font-black text-[#25443a]">
                      خبرهای مستقل
                    </h3>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {ungrouped.map((item) => (
                      <TimelineCard key={item.id} item={item} onStory={setOpenStory} now={now} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </section>
        </>
      )}
      {openStory && <ProductStoryViewer key={openStory.id} entry={openStory} onClose={() => setOpenStory(null)} />}
    </div>
  );
}
