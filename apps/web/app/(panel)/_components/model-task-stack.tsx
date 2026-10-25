"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronLeft, CircleAlert, WandSparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatPersianNumber } from "@/lib/fa-number";
import { ModelThinkingOrb } from "./model-thinking-orb";
import { useModelTasks, type ModelTask } from "./model-task-provider";

const taskTone: Record<ModelTask["status"], string> = {
  running: "border-[#cfe2d9] bg-[#fbfdfc] text-[#176b57]",
  completed: "border-[#d8e7df] bg-white text-[#12664f]",
  canceled: "border-[#e5e9e6] bg-[#fafbfa] text-[#74827e]",
  error: "border-[#eedfca] bg-[#fffcf8] text-[#966925]",
};

function taskDescription(task: ModelTask) {
  if (task.status === "running") return "در حال آماده‌سازی";
  if (task.status === "completed") return "نتیجه آمادهٔ مشاهده است";
  if (task.status === "canceled") return "لغو شد";
  return task.error || "انجام نشد";
}

function TaskCard({ task, featured }: { task: ModelTask; featured?: boolean }) {
  const { openTask, cancelTask } = useModelTasks();

  return (
    <div
      className={cn(
        "flex min-w-0 items-center rounded-xl border transition-[border-color,background-color,box-shadow] hover:border-[#a9ccbb]",
        taskTone[task.status],
        featured && "shadow-[0_3px_12px_rgba(27,55,50,.05)]",
      )}
    >
      <button
        type="button"
        className={cn("flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-right", featured && "py-2.5")}
        onClick={() => openTask(task)}
        aria-label={`${task.title}، ${task.status === "running" ? task.pendingLabel : taskDescription(task)}`}
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center",
            task.status !== "running" && "rounded-full bg-current/10",
          )}
        >
          {task.status === "running" ? (
            <ModelThinkingOrb label={task.pendingLabel} size={20} />
          ) : task.status === "completed" ? (
            <CheckCircle2 size={16} />
          ) : (
            <CircleAlert size={16} />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-[11px] leading-5 text-[#19312f]">{task.title}</strong>
          <small className="mt-0.5 line-clamp-2 text-[9px] leading-[1.6] opacity-80">{taskDescription(task)}</small>
        </span>
        {task.status === "completed" && <ChevronLeft className="shrink-0 opacity-55" size={14} />}
      </button>
      {task.status === "running" && (
        <button
          type="button"
          className="ml-2 grid size-7 shrink-0 place-items-center rounded-lg text-[#a5483e] hover:bg-[#fff1ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62]"
          aria-label={`لغو ${task.title}`}
          onClick={() => cancelTask(task.id)}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function ModelTaskStack() {
  const { tasks } = useModelTasks();
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [suppressHover, setSuppressHover] = useState(false);
  const expanded = pinned || (hovered && !suppressHover);
  const latest = tasks[0];

  if (!latest) return null;

  const older = tasks.slice(1);
  const hasHistory = older.length > 0;
  const showHistory = hasHistory && expanded;

  const headerContent = (
    <>
      <WandSparkles className="shrink-0 text-[#0f7b62]" size={16} />
      <strong className="min-w-0 flex-1 text-[11px]">فعالیت‌های هوشمند</strong>
      {hasHistory && (
        <>
          <span className="text-[10px] font-medium tabular-nums text-[#7c9087]" aria-label={`${formatPersianNumber(tasks.length)} فعالیت`}>
            {formatPersianNumber(tasks.length)}
          </span>
          <ChevronDown
            size={14}
            className={cn(
              "text-[#789288] transition-transform duration-300 motion-reduce:transition-none",
              showHistory && "rotate-180",
            )}
          />
        </>
      )}
    </>
  );

  return (
    <section
      aria-label="فعالیت‌های هوشمند"
      aria-live="polite"
      className="min-h-0 rounded-2xl border border-[#dde9e2] bg-white p-2.5 shadow-[0_8px_24px_rgba(24,73,60,.06)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setSuppressHover(false);
      }}
    >
      {hasHistory ? (
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-1 pb-2 text-right text-[#1b5145] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62]"
          aria-expanded={showHistory}
          aria-controls="model-task-history"
          onClick={() => {
            setPinned(!expanded);
            setSuppressHover(expanded);
          }}
        >
          {headerContent}
        </button>
      ) : (
        <div className="flex items-center gap-2 px-1 pb-2 text-[#1b5145]">{headerContent}</div>
      )}
      <div className={cn("relative", hasHistory && "pb-2.5")}>
        {hasHistory && (
          <>
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-x-3 bottom-0 h-10 rounded-xl border border-[#e2eae5] bg-[#f8fbf9] transition-[opacity,transform] duration-300 motion-reduce:transition-none",
                showHistory && "translate-y-1 opacity-0",
              )}
            />
            {older.length > 1 && (
              <div
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-1.5 bottom-1 h-10 rounded-xl border border-[#e4ebe6] bg-[#fbfcfb] transition-[opacity,transform] duration-300 motion-reduce:transition-none",
                  showHistory && "translate-y-1 opacity-0",
                )}
              />
            )}
          </>
        )}
        <div className="relative z-10">
          <TaskCard task={latest} featured />
        </div>
      </div>
      {hasHistory && (
        <div
          id="model-task-history"
          aria-hidden={!showHistory}
          inert={!showHistory}
          className={cn(
            "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none",
            showHistory ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="grid max-h-[min(42vh,320px)] gap-1.5 overflow-y-auto pr-0.5">
              {older.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
