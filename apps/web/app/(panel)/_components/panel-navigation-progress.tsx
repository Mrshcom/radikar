"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type ProgressStage = "idle" | "starting" | "loading" | "complete";

export function PanelNavigationProgress() {
  const pathname = usePathname();
  const [stage, setStage] = useState<ProgressStage>("idle");
  const isNavigatingRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const start = useCallback(() => {
    clearTimers();
    isNavigatingRef.current = true;
    setStage("starting");
    timersRef.current.push(window.setTimeout(() => setStage("loading"), 140));
    timersRef.current.push(
      window.setTimeout(() => {
        isNavigatingRef.current = false;
        setStage("idle");
      }, 8_000),
    );
  }, [clearTimers]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      const href = link?.getAttribute("href");
      if (
        !link ||
        !href ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        href === pathname ||
        href.startsWith("#") ||
        !href.startsWith("/") ||
        href.startsWith("//")
      ) {
        return;
      }

      start();
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [pathname, start]);

  useEffect(() => {
    if (!isNavigatingRef.current) return;

    isNavigatingRef.current = false;
    clearTimers();
    setStage("complete");
    timersRef.current.push(window.setTimeout(() => setStage("idle"), 260));
  }, [clearTimers, pathname]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 bg-transparent">
      <span
        className={cn(
          "block h-full rounded-e-full bg-[#0f7b62] shadow-[0_2px_9px_rgba(15,123,98,.45)] transition-[width,opacity] duration-300 ease-out",
          stage === "idle" && "w-0 opacity-0",
          stage === "starting" && "w-[18%] opacity-100",
          stage === "loading" && "w-[76%] opacity-100",
          stage === "complete" && "w-full opacity-0",
        )}
      />
    </div>
  );
}
