"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Check, Image as ImageIcon, LoaderCircle, X } from "lucide-react";
import { RangeSlider } from "@/app/_components/range-slider";

const defaultViewportSize = 280;
const outputSize = 512;

type ImageEditorModalProps = {
  file: File;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
};

type ImageMetrics = {
  element: HTMLImageElement;
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ImageEditorModal({
  file,
  onCancel,
  onConfirm,
}: ImageEditorModalProps) {
  const [source, setSource] = useState("");
  const [metrics, setMetrics] = useState<ImageMetrics | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [viewportSize, setViewportSize] = useState(defaultViewportSize);
  const cropViewportRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    const viewport = cropViewportRef.current;
    if (!viewport) return;
    const updateViewportSize = () =>
      setViewportSize(Math.round(viewport.getBoundingClientRect().width));
    updateViewportSize();
    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    let active = true;
    image.onload = () => {
      if (!active) return;
      setMetrics({
        element: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      setSource(objectUrl);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    image.onerror = () => {
      if (active) onCancelRef.current();
    };
    image.src = objectUrl;
    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const displayGeometry = metrics
    ? (() => {
        const scale =
          Math.max(
            viewportSize / metrics.width,
            viewportSize / metrics.height,
          ) * zoom;
        const width = metrics.width * scale;
        const height = metrics.height * scale;
        const centeredX = (viewportSize - width) / 2;
        const centeredY = (viewportSize - height) / 2;
        const maxOffsetX = Math.max(0, (width - viewportSize) / 2);
        const maxOffsetY = Math.max(0, (height - viewportSize) / 2);
        return {
          scale,
          width,
          height,
          left: centeredX + clamp(offset.x, -maxOffsetX, maxOffsetX),
          top: centeredY + clamp(offset.y, -maxOffsetY, maxOffsetY),
        };
      })()
    : null;
  const updateZoom = (nextZoom: number) => {
    setZoom(clamp(Number(nextZoom.toFixed(2)), 1, 3));
    setOffset((current) => ({ x: current.x * nextZoom / zoom, y: current.y * nextZoom / zoom }));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!displayGeometry) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY };
    offsetStart.current = offset;
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !displayGeometry) return;
    const maxOffsetX = Math.max(0, (displayGeometry.width - viewportSize) / 2);
    const maxOffsetY = Math.max(0, (displayGeometry.height - viewportSize) / 2);
    setOffset({
      x: clamp(offsetStart.current.x + event.clientX - dragStart.current.x, -maxOffsetX, maxOffsetX),
      y: clamp(offsetStart.current.y + event.clientY - dragStart.current.y, -maxOffsetY, maxOffsetY),
    });
  };

  const createCrop = () => {
    if (!metrics || !displayGeometry) return;
    setGenerating(true);
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext("2d");
    if (!context) {
      setGenerating(false);
      return;
    }
    const sourceX = Math.max(0, -displayGeometry.left / displayGeometry.scale);
    const sourceY = Math.max(0, -displayGeometry.top / displayGeometry.scale);
    const sourceSize = viewportSize / displayGeometry.scale;
    context.drawImage(
      metrics.element,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize,
    );
    onConfirm(canvas.toDataURL("image/jpeg", 0.9));
    setGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-[rgba(13,35,32,.58)] p-4 backdrop-blur-[5px]" role="presentation" onMouseDown={onCancel}>
      <section className="w-[min(430px,100%)] overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(10,38,33,.3)]" role="dialog" aria-modal="true" aria-labelledby="image-editor-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-[#edf1ee] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#eaf6f0] text-[#0f7b62]"><ImageIcon size={18} /></span>
            <div>
              <h2 id="image-editor-title" className="m-0 text-[14px] font-black text-[#19312f]">ویرایش تصویر پروفایل</h2>
              <p className="m-0 mt-1 text-[9px] text-[#7f908b]">تصویر را جابه‌جا کن و کادر مناسب را انتخاب کن.</p>
            </div>
          </div>
          <button className="grid size-8 place-items-center rounded-full border border-[#dfe7e2] text-[#72837e]" type="button" onClick={onCancel} aria-label="بستن"><X size={17} /></button>
        </header>

        <div className="p-5">
          <div
            ref={cropViewportRef}
            className="relative mx-auto aspect-square w-[min(280px,calc(100vw-80px))] cursor-grab touch-none overflow-hidden rounded-[18px] bg-[#122e28] ring-4 ring-[#e8f2ed] active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
          >
            {source && displayGeometry ? <img className="pointer-events-none absolute max-w-none select-none" src={source} alt="پیش‌نمایش تصویر پروفایل" style={{ width: displayGeometry.width, height: displayGeometry.height, left: displayGeometry.left, top: displayGeometry.top }} draggable={false} /> : <div className="grid size-full place-items-center text-white/70"><LoaderCircle className="animate-spin" size={24} /></div>}
            <div className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/40" />
            <div className="pointer-events-none absolute inset-0 border-[2px] border-white/65" />
          </div>

          <RangeSlider
            className="mt-6"
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            onChange={updateZoom}
            label="بزرگ‌نمایی تصویر"
            valueFormatter={(value) => `${Math.round(value * 100)}%`}
          />
          <p className="mb-0 mt-3 text-center text-[9px] text-[#84938f]">برای جابه‌جایی تصویر، داخل کادر بکش.</p>
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#edf1ee] bg-[#fbfcfa] px-5 py-4">
          <button className="min-h-10 rounded-[10px] border border-[#dfe7e2] bg-white px-4 text-[10px] font-bold text-[#62736e]" type="button" onClick={onCancel}>انصراف</button>
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0f7b62] px-5 text-[10px] font-bold text-white disabled:opacity-50" type="button" disabled={!displayGeometry || generating} onClick={createCrop}>{generating ? <LoaderCircle className="animate-spin" size={15} /> : <Check size={15} />} استفاده از تصویر</button>
        </footer>
      </section>
    </div>
  );
}
