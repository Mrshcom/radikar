"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { ProductTimelineEntry } from "@radikar/shared-types";
import { Modal } from "../_components/ui";

export function ProductStoryViewer({ entry, onClose }: { entry: ProductTimelineEntry; onClose: () => void }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = entry.storySlides;
  const slide = slides[slideIndex];

  useEffect(() => {
    const onArrowKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") setSlideIndex((current) => Math.min(current + 1, slides.length - 1));
      if (event.key === "ArrowRight") setSlideIndex((current) => Math.max(current - 1, 0));
    };
    window.addEventListener("keydown", onArrowKey);
    return () => window.removeEventListener("keydown", onArrowKey);
  }, [slides.length]);

  if (!slide) return null;

  return (
    <Modal
      title={entry.title}
      description="استوری این قابلیت را هر زمان بخواهی می‌توانی دوباره ببینی."
      showCloseButton
      onClose={onClose}
      headerActions={<span className="text-[11px] text-[#71817d]">{`${slideIndex + 1} / ${slides.length}`}</span>}
    >
      <div className="mt-4 flex gap-1" aria-label={`اسلاید ${slideIndex + 1} از ${slides.length}`}>
        {slides.map((item, index) => (
          <span
            key={`${index}-${item.title}`}
            className={`h-1 min-w-0 flex-1 rounded-full ${index <= slideIndex ? "bg-[#0f7b62]" : "bg-[#e0e9e3]"}`}
          />
        ))}
      </div>
      <div className="mt-4 flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-bl from-[#dff3e9] via-[#f5fbf6] to-[#f9f3df] p-6 text-center sm:min-h-[390px]">
        {slide.imagePath ? (
          <Image
            src={slide.imagePath}
            alt=""
            width={420}
            height={230}
            className="mb-4 max-h-[200px] w-auto max-w-full object-contain"
          />
        ) : (
          <span className="mb-5 grid size-16 place-items-center rounded-[22px] bg-white/80 text-[#0f7b62] shadow-[0_12px_30px_rgba(15,123,98,.12)]">
            <Sparkles size={30} />
          </span>
        )}
        <h3 className="m-0 max-w-md text-[22px] font-black leading-[1.6] text-[#19312f]">{slide.title}</h3>
        <p className="mb-0 mt-3 max-w-md whitespace-pre-line text-[13px] leading-8 text-[#506b62]">{slide.body}</p>
        {slide.ctaHref && slide.ctaLabel ? (
          <Link
            href={slide.ctaHref}
            onClick={onClose}
            className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0f7b62] px-5 text-[12px] font-bold text-white no-underline transition-colors hover:bg-[#09664f]"
          >
            {slide.ctaLabel} <ArrowLeft size={16} />
          </Link>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSlideIndex((current) => Math.max(current - 1, 0))}
          disabled={slideIndex === 0}
          className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-[#dfe8e1] px-4 text-[11px] font-semibold text-[#557168] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowRight size={15} /> قبلی
        </button>
        <button
          type="button"
          onClick={() => (slideIndex === slides.length - 1 ? onClose() : setSlideIndex((current) => current + 1))}
          className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#0f7b62] px-4 text-[11px] font-semibold text-white hover:bg-[#09664f]"
        >
          {slideIndex === slides.length - 1 ? "پایان" : "بعدی"} <ArrowLeft size={15} />
        </button>
      </div>
    </Modal>
  );
}
