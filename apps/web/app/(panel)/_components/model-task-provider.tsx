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

export type ModelTaskStatus = "running" | "completed" | "error" | "canceled";

export type ModelTask = {
  id: string;
  key: string;
  title: string;
  pendingLabel: string;
  completedLabel: string;
  status: ModelTaskStatus;
  href: string;
  context?: unknown;
  error?: string;
  createdAt: number;
};

type RunModelTaskInput<TResult> = {
  key: string;
  title: string;
  pendingLabel: string;
  completedLabel: string;
  href: string;
  context?: unknown;
  run: (signal: AbortSignal) => Promise<TResult>;
  getCompletedHref?: (result: TResult) => string;
};

type ModelTaskContextValue = {
  tasks: ModelTask[];
  isRunning: (key: string) => boolean;
  runModelTask: <TResult>(input: RunModelTaskInput<TResult>) => Promise<TResult>;
  openTask: (task: ModelTask) => void;
  cancelTask: (taskId: string) => void;
  dismissTask: (taskId: string) => void;
};

const ModelTaskContext = createContext<ModelTaskContextValue | null>(null);

function createTaskId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `model-task-${crypto.randomUUID()}`
    : `model-task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class ModelTaskCanceledError extends Error {
  constructor() {
    super("عملیات مدل لغو شد.");
    this.name = "ModelTaskCanceledError";
  }
}

export function isModelTaskCanceledError(error: unknown) {
  return (
    error instanceof ModelTaskCanceledError ||
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function ModelTaskStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<ModelTask[]>([]);
  const runningCountRef = useRef(0);
  const controllersRef = useRef(new Map<string, AbortController>());
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
      const controller = new AbortController();
      controllersRef.current.set(id, controller);
      const task: ModelTask = {
        id,
        key: input.key,
        title: input.title,
        pendingLabel: input.pendingLabel,
        completedLabel: input.completedLabel,
        status: "running",
        href: input.href,
        context: input.context,
        createdAt: Date.now(),
      };
      setTasks((current) => [task, ...current]);

      try {
        const result = (await mutateAsync(() =>
          input.run(controller.signal),
        )) as TResult;
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
        if (controller.signal.aborted || isModelTaskCanceledError(error)) {
          setTasks((current) =>
            current.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "canceled",
                    error: "عملیات توسط شما لغو شد.",
                  }
                : item,
            ),
          );
          throw new ModelTaskCanceledError();
        }
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
        controllersRef.current.delete(id);
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
  const cancelTask = useCallback((taskId: string) => {
    const controller = controllersRef.current.get(taskId);
    if (!controller) return;
    controller.abort();
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "canceled",
              error: "عملیات توسط شما لغو شد.",
            }
          : task,
      ),
    );
  }, []);
  const openTask = useCallback(
    (task: ModelTask) => {
      router.push(task.href);
      if (task.status !== "running") dismissTask(task.id);
    },
    [dismissTask, router],
  );
  const value = useMemo<ModelTaskContextValue>(
    () => ({
      tasks,
      isRunning,
      runModelTask,
      openTask,
      cancelTask,
      dismissTask,
    }),
    [cancelTask, dismissTask, isRunning, openTask, runModelTask, tasks],
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
