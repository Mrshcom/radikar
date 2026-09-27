"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type HoverTooltipProps = {
  children: ReactNode;
  content: ReactNode | null;
  className?: string;
  contentClassName?: string;
  as?: "article" | "div" | "span";
};

type TooltipPosition = { top: number; left: number; arrowLeft: number; below: boolean };

export function HoverTooltip({ children, content, className, contentClassName, as: Tag = "span" }: HoverTooltipProps) {
  const targetRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const updatePosition = useCallback(() => {
    const target = targetRef.current;
    const tooltip = tooltipRef.current;
    if (!target || !tooltip) return;
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const gutter = 10;
    const below = targetRect.top - tooltipRect.height - gutter < 8;
    const rawLeft = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    const left = Math.min(Math.max(8, rawLeft), window.innerWidth - tooltipRect.width - 8);
    setPosition({
      top: below ? targetRect.bottom + gutter : targetRect.top - tooltipRect.height - gutter,
      left,
      arrowLeft: Math.min(Math.max(14, targetRect.left + targetRect.width / 2 - left), tooltipRect.width - 14),
      below,
    });
  }, []);

  const showTooltip = () => {
    setPosition(null);
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frame);
  }, [content, open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <Tag
      className={cn("inline-flex", className)}
      onBlur={() => setOpen(false)}
      onFocus={showTooltip}
      onMouseEnter={showTooltip}
      onMouseLeave={() => setOpen(false)}
      ref={(element) => { targetRef.current = element; }}
    >
      {children}
      {content != null && open && typeof document !== "undefined" && createPortal(
        <span
          className={cn("pointer-events-none fixed z-[100] w-max max-w-[calc(100vw-16px)] whitespace-nowrap rounded-xl border border-[#28594d] bg-[#19312f] px-3 py-2 text-center text-[10px] text-white shadow-[0_10px_30px_rgba(25,49,47,.2)] transition-opacity", position ? "opacity-100" : "opacity-0", contentClassName)}
          ref={tooltipRef}
          role="tooltip"
          style={{ left: position?.left ?? -10_000, top: position?.top ?? -10_000 }}
        >
          {content}
          {position && <span aria-hidden="true" className={`absolute size-3 rotate-45 border-[#28594d] bg-[#19312f] ${position.below ? "-top-1.5 border-l border-t" : "-bottom-1.5 border-b border-r"}`} style={{ left: position.arrowLeft - 6 }} />}
        </span>,
        document.body,
      )}
    </Tag>
  );
}
