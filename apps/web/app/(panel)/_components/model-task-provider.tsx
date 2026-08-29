"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

export type ModelTaskStatus = "running" | "completed" | "error";

export type ModelTask = {
  id: string;
  key: string;
  title: string;
  pendingLabel: string;
  completedLabel: string;
  status: ModelTaskStatus;
  href: string;
  error?: string;
  createdAt: number;
};

type RunModelTaskInput<TResult> = {
  key: string;
  title: string;
  pendingLabel: string;
  completedLabel: string;
  href: string;
  run: () => Promise<TResult>;
  getCompletedHref?: (result: TResult) => string;
};

type ModelTaskContextValue = {
  tasks: ModelTask[];
  isRunning: (key: string) => boolean;
  runModelTask: <TResult>(input: RunModelTaskInput<TResult>) => Promise<TResult>;
  openTask: (task: ModelTask) => void;
  dismissTask: (taskId: string) => void;
};

const ModelTaskContext = createContext<ModelTaskContextValue | null>(null);

function createTaskId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `model-task-${crypto.randomUUID()}`
    : `model-task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ModelTaskStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<ModelTask[]>([]);
  const runningCountRef = useRef(0);
  const { mutateAsync } = useMutation({
    mutationFn: (operation: () => Promise<unknown>) => operation(),
  });

  const runModelTask = useCallback(
    async <TResult,>(input: RunModelTaskInput<TResult>) => {
      if (runningCountRef.current >= 2)
        throw new Error(
          "دو درخواست مدل در حال انجام است؛ منتظر بمان تا یکی از آن‌ها تمام شود.",
        );
      runningCountRef.current += 1;
      const id = createTaskId();
      const task: ModelTask = {
        id,
        key: input.key,
        title: input.title,
        pendingLabel: input.pendingLabel,
        completedLabel: input.completedLabel,
        status: "running",
        href: input.href,
        createdAt: Date.now(),
      };
      setTasks((current) => [task, ...current]);

      try {
        const result = (await mutateAsync(input.run)) as TResult;
        setTasks((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "completed",
                  href: input.getCompletedHref?.(result) || input.href,
                }
              : item,
          ),
        );
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "عملیات مدل ناموفق بود.";
        setTasks((current) =>
          current.map((item) =>
            item.id === id
              ? { ...item, status: "error", error: message }
              : item,
          ),
        );
        throw error;
      } finally {
        runningCountRef.current = Math.max(0, runningCountRef.current - 1);
      }
    },
    [mutateAsync],
  );

  const isRunning = useCallback(
    (key: string) =>
      tasks.some((task) => task.key === key && task.status === "running"),
    [tasks],
  );
  const dismissTask = useCallback(
    (taskId: string) =>
      setTasks((current) => current.filter((task) => task.id !== taskId)),
    [],
  );
  const openTask = useCallback(
    (task: ModelTask) => {
      router.push(task.href);
      if (task.status !== "running") dismissTask(task.id);
    },
    [dismissTask, router],
  );
  const value = useMemo<ModelTaskContextValue>(
    () => ({ tasks, isRunning, runModelTask, openTask, dismissTask }),
    [dismissTask, isRunning, openTask, runModelTask, tasks],
  );

  return (
    <ModelTaskContext.Provider value={value}>
      {children}
    </ModelTaskContext.Provider>
  );
}

export function ModelTaskProvider({ children }: { children: ReactNode }) {
  return <ModelTaskStateProvider>{children}</ModelTaskStateProvider>;
}

export function useModelTasks() {
  const context = useContext(ModelTaskContext);
  if (!context)
    throw new Error("useModelTasks must be used inside ModelTaskProvider");
  return context;
}
