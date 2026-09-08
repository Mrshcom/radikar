"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  GripVertical,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal, Modal, SectionTitle } from "../_components/ui";
import { JobDetailsModal, JobLogo } from "../_components/job-card";
import { ApplicationsSkeleton } from "../_components/loading-skeletons";
import { useToast } from "@/app/_components/toast";
import {
  applicationStore,
  createRecordId,
  jobStore,
} from "@/lib/data/stores";
import type {
  ApplicationRecord,
  ApplicationStage,
  JobRecord,
} from "@/lib/data/models";
import { formatPersianNumber } from "@/lib/fa-number";
import {
  applicationPipelineStages,
  moveApplicationToStage,
  synchronizeJobsWithApplicationBoard,
} from "@/lib/application-board";

function formatUpdateTime(date: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

async function readApplicationBoard() {
  const [jobs, storedApplications] = await Promise.all([
    jobStore.list(),
    applicationStore.list(),
  ]);
  const synchronized = synchronizeJobsWithApplicationBoard(
    jobs,
    storedApplications,
  );
  await Promise.all(
    synchronized.additions.map((application) =>
      applicationStore.put(application),
    ),
  );
  return { applications: synchronized.applications, jobs };
}

export default function ApplicationsPage() {
  const notify = useToast();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [draggingId, setDraggingId] = useState<string>();
  const [dragOverStage, setDragOverStage] = useState<ApplicationStage>();
  const [pendingId, setPendingId] = useState<string>();
  const [deleteCandidate, setDeleteCandidate] =
    useState<ApplicationRecord>();
  const [detailsCandidate, setDetailsCandidate] =
    useState<ApplicationRecord>();

  const loadPipeline = async () => {
    setLoading(true);
    setError("");
    try {
      const board = await readApplicationBoard();
      setApplications(board.applications);
      setJobs(board.jobs);
    } catch (event) {
      const message =
        event instanceof Error
          ? event.message
          : "خواندن اپلای‌های ذخیره‌شده ناموفق بود.";
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    readApplicationBoard()
      .then((board) => {
        if (active) {
          setApplications(board.applications);
          setJobs(board.jobs);
        }
      })
      .catch((event: unknown) => {
        if (active) {
          const message =
            event instanceof Error
              ? event.message
              : "خواندن اپلای‌های ذخیره‌شده ناموفق بود.";
          setError(message);
          notify(message, "error");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [notify]);

  const groupedApplications = useMemo(
    () =>
      Object.fromEntries(
        applicationPipelineStages.map((stage) => [
          stage.id,
          applications.filter((application) => application.stage === stage.id),
        ]),
      ) as Record<ApplicationStage, ApplicationRecord[]>,
    [applications],
  );

  const jobsById = useMemo(
    () => new Map(jobs.map((job) => [job.id, job])),
    [jobs],
  );

  const detailsJob = useMemo(() => {
    if (!detailsCandidate) return undefined;
    const linkedJob = detailsCandidate.jobId
      ? jobsById.get(detailsCandidate.jobId)
      : undefined;
    return (
      linkedJob ?? {
        company: detailsCandidate.company,
        role: detailsCandidate.role,
        match: detailsCandidate.match ?? 0,
        place: "",
        age: "",
      }
    );
  }, [detailsCandidate, jobsById]);

  const responseStats = useMemo(() => {
    const sent = applications.filter(
      (application) => application.stage !== "saved",
    );
    const responded = sent.filter(
      (application) =>
        application.stage === "review" || application.stage === "interview",
    );
    const responseDays = responded
      .filter((application) => application.appliedAt)
      .map((application) =>
        Math.max(
          0,
          Math.round(
            (new Date(application.updatedAt).getTime() -
              new Date(application.appliedAt!).getTime()) /
              86400000,
          ),
        ),
      );
    return {
      sentCount: sent.length,
      rate: sent.length
        ? `${formatPersianNumber(Math.round((responded.length / sent.length) * 100))}٪`
        : "—",
      average: responseDays.length
        ? `${formatPersianNumber(Math.round(responseDays.reduce((sum, day) => sum + day, 0) / responseDays.length))} روز`
        : "—",
    };
  }, [applications]);

  const addApplication = async () => {
    if (!newRole.trim() || !newCompany.trim()) {
      notify("عنوان شغل و نام شرکت را وارد کن.", "error");
      return;
    }
    const now = new Date().toISOString();
    const application: ApplicationRecord = {
      id: createRecordId("application"),
      role: newRole.trim(),
      company: newCompany.trim(),
      stage: "applied",
      appliedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await applicationStore.put(application);
      setApplications((current) => [application, ...current]);
      setAddOpen(false);
      setNewRole("");
      setNewCompany("");
      notify("اپلای جدید ذخیره شد");
    } catch {
      notify("ذخیره اپلای جدید ناموفق بود.", "error");
    }
  };

  const changeStage = async (
    application: ApplicationRecord,
    stage: ApplicationStage,
  ) => {
    if (application.stage === stage || pendingId === application.id) return;
    const updated = moveApplicationToStage(
      application,
      stage,
      new Date().toISOString(),
    );
    const stageTitle = applicationPipelineStages.find(
      (item) => item.id === stage,
    )?.title;
    setPendingId(application.id);
    try {
      await applicationStore.put(updated);
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      notify(`فرصت به مرحله «${stageTitle}» منتقل شد`);
    } catch {
      notify("تغییر مرحله اپلای ناموفق بود.", "error");
    } finally {
      setPendingId(undefined);
    }
  };

  const removeFromBoard = async (application: ApplicationRecord) => {
    if (application.stage !== "saved" || pendingId === application.id) return;
    setPendingId(application.id);
    try {
      if (application.jobId) {
        const job = await jobStore.get(application.jobId);
        if (job) {
          const now = new Date().toISOString();
          await jobStore.put({
            ...job,
            applicationBoardDismissedAt: now,
            updatedAt: now,
          });
        }
      }
      await applicationStore.remove(application.id);
      setApplications((current) =>
        current.filter((item) => item.id !== application.id),
      );
      setDeleteCandidate(undefined);
      notify("فرصت از برد پیگیری حذف شد");
    } catch {
      notify("حذف فرصت از برد ناموفق بود.", "error");
    } finally {
      setPendingId(undefined);
    }
  };

  const dropOnStage = (
    event: DragEvent<HTMLElement>,
    stage: ApplicationStage,
  ) => {
    event.preventDefault();
    const applicationId =
      event.dataTransfer.getData("text/plain") || draggingId;
    const application = applications.find((item) => item.id === applicationId);
    setDraggingId(undefined);
    setDragOverStage(undefined);
    if (application) void changeStage(application, stage);
  };

  const adjacentStage = (
    application: ApplicationRecord,
    offset: -1 | 1,
  ) => {
    const currentIndex = applicationPipelineStages.findIndex(
      (stage) => stage.id === application.stage,
    );
    return applicationPipelineStages[currentIndex + offset];
  };

  if (loading) return <ApplicationsSkeleton />;
  const primaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border-0 bg-[#0f7b62] px-[15px] text-[11px] font-bold text-white disabled:opacity-45";
  const secondaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#e1e6e0] bg-white px-[15px] text-[11px] font-bold text-[#526461]";
  if (error)
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[15px] border border-dashed border-[#dce3dc] text-[#8b9996] [&_h3]:mb-[3px] [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:text-[#19312f] [&_p]:mb-[14px] [&_p]:mt-0 [&_p]:text-[9px]">
        <Target size={34} />
        <h3>خواندن اپلای‌ها ناموفق بود</h3>
        <p>{error}</p>
        <button className={secondaryButton} onClick={loadPipeline}>
          تلاش دوباره
        </button>
      </div>
    );

  return (
    <>
      <SectionTitle
        title="پیگیری اپلای‌ها"
        description="فرصت‌های ساخته‌شده از ستون ذخیره‌شده شروع می‌شوند؛ وضعیتشان را انتخاب کن یا کارت را بین ستون‌ها بکش."
        action={
          <button className={primaryButton} onClick={() => setAddOpen(true)}>
            <Plus size={18} /> افزودن اپلای
          </button>
        }
      />
      <div className="mb-4 flex items-center gap-7 rounded-[13px] border border-[#e7ebe6] bg-white px-4 py-3 text-[10px] text-[#71817e] max-[560px]:overflow-x-auto [&_span]:whitespace-nowrap">
        <span>
          <i className="ml-1 inline-block size-1.5 rounded-full bg-[#5a8bb5]" />{" "}
          {formatPersianNumber(responseStats.sentCount)} اپلای ثبت‌شده
        </span>
        <span>
          نرخ پاسخ{" "}
          <strong className="text-[#19312f]">{responseStats.rate}</strong>
        </span>
        <span>
          میانگین پاسخ{" "}
          <strong className="text-[#19312f]">{responseStats.average}</strong>
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3 overflow-x-auto max-[1120px]:grid-cols-[repeat(4,250px)]">
        {applicationPipelineStages.map((stage) => (
          <section
            aria-label={`ستون ${stage.title}`}
            className={`min-h-[440px] rounded-[15px] border p-[10px] transition-colors ${dragOverStage === stage.id ? "border-[#83bfab] bg-[#e5f2ec]" : "border-transparent bg-[#eef1ed]"}`}
            key={stage.id}
            onDragEnter={() => setDragOverStage(stage.id)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node))
                setDragOverStage(undefined);
            }}
            onDrop={(event) => dropOnStage(event, stage.id)}
          >
            <div className="mb-[10px] flex items-center justify-between px-1 py-1">
              <strong className="text-[10px]">{stage.title}</strong>
              <span className="grid size-6 place-items-center rounded-lg bg-white text-[8px] text-[#758582]">
                {formatPersianNumber(groupedApplications[stage.id].length)}
              </span>
            </div>
            {groupedApplications[stage.id].map((application) => (
              <article
                aria-label={`${application.role} در ${application.company}`}
                className={`mb-2 cursor-pointer rounded-xl border border-[#e2e7e2] bg-white p-3 shadow-[0_7px_20px_rgba(27,55,50,.05)] transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#83bfab] ${draggingId === application.id ? "scale-[.98] opacity-45" : "opacity-100"}`}
                draggable={pendingId !== application.id}
                key={application.id}
                onClick={() => setDetailsCandidate(application)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setDetailsCandidate(application);
                  }
                }}
                onDragEnd={() => {
                  setDraggingId(undefined);
                  setDragOverStage(undefined);
                }}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", application.id);
                  setDraggingId(application.id);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex min-h-7 items-center gap-2">
                  <span
                    className="cursor-grab touch-none text-[#a1ada9] active:cursor-grabbing"
                    title="برای جابه‌جایی بکشید"
                  >
                    <GripVertical size={15} />
                  </span>
                  <JobLogo
                    company={application.company}
                    letter={
                      application.jobId
                        ? jobsById.get(application.jobId)?.letter
                        : undefined
                    }
                    logoUrl={
                      application.jobId
                        ? jobsById.get(application.jobId)?.logoUrl
                        : undefined
                    }
                    tone={
                      application.jobId
                        ? jobsById.get(application.jobId)?.tone
                        : undefined
                    }
                    variant="board"
                  />
                  <small className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[8px] text-[#7b8986]">
                    {application.company}
                  </small>
                  {typeof application.match === "number" && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#e8f4ef] px-2 py-1 text-[8px] font-bold text-[#0f7b62]">
                      <Target size={12} /> تطابق{" "}
                      {formatPersianNumber(application.match)}٪
                    </span>
                  )}
                </div>
                <h3 className="mb-2 mt-3 text-[10px]">{application.role}</h3>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    aria-label="بازگشت به مرحله قبل"
                    className="grid size-7 place-items-center rounded-lg border border-[#e5eae5] bg-white text-[#70807c] disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={
                      !adjacentStage(application, -1) ||
                      pendingId === application.id
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      const previousStage = adjacentStage(application, -1);
                      if (previousStage)
                        void changeStage(application, previousStage.id);
                    }}
                    title="مرحله قبل"
                    type="button"
                  >
                    <ArrowRight size={14} />
                  </button>
                  <span className="text-[7px] text-[#9aa5a2]">
                    کارت را برای جابه‌جایی بکشید
                  </span>
                  <button
                    aria-label="انتقال به مرحله بعد"
                    className="grid size-7 place-items-center rounded-lg border border-[#d9e9e2] bg-[#edf7f2] text-[#0f7b62] disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={
                      !adjacentStage(application, 1) ||
                      pendingId === application.id
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      const nextStage = adjacentStage(application, 1);
                      if (nextStage)
                        void changeStage(application, nextStage.id);
                    }}
                    title="مرحله بعد"
                    type="button"
                  >
                    <ArrowLeft size={14} />
                  </button>
                </div>
                <footer className="mt-3 flex items-center justify-between gap-2 border-t border-[#edf0ec] pt-2 text-[8px] text-[#9aa5a2]">
                  <span className="flex min-w-0 items-center gap-1">
                    <Clock3 size={13} /> آخرین تغییر{" "}
                    {formatUpdateTime(application.updatedAt)}
                  </span>
                  {application.stage === "saved" && (
                    <button
                      aria-label="حذف فرصت اپلای‌نشده از برد"
                      className="grid shrink-0 place-items-center rounded-lg border-0 bg-transparent p-0 text-[#9ba7a3] transition-colors hover:bg-[#fff0ee] hover:text-[#b84e45] mx-1"
                      disabled={pendingId === application.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteCandidate(application);
                      }}
                      title="حذف از برد"
                      type="button"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </footer>
              </article>
            ))}
          </section>
        ))}
      </div>
      {detailsJob && (
        <JobDetailsModal
          job={detailsJob}
          onClose={() => setDetailsCandidate(undefined)}
        />
      )}
      {addOpen && (
        <Modal
          title="افزودن اپلای"
          description="فقط فرصت‌هایی را ثبت کن که واقعاً برایشان اقدام کرده‌ای."
          onClose={() => setAddOpen(false)}
        >
          <div className="grid gap-[14px] pt-[18px] [&_label]:grid [&_label]:gap-[7px] [&_label]:text-[10px] [&_label]:font-semibold [&_label]:text-[#536562] [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border [&_input]:border-[#dfe5df] [&_input]:bg-[#fbfcfa] [&_input]:px-3 [&_input]:py-[11px] [&_input]:text-[12px] [&_input]:outline-0">
            <label>
              عنوان موقعیت
              <input
                value={newRole}
                onChange={(event) => setNewRole(event.target.value)}
                placeholder="عنوان موقعیت"
              />
            </label>
            <label>
              نام شرکت
              <input
                value={newCompany}
                onChange={(event) => setNewCompany(event.target.value)}
                placeholder="نام شرکت"
              />
            </label>
            <div className="flex justify-end gap-2 pt-[5px] max-[560px]:flex-col-reverse">
              <button
                className={secondaryButton}
                onClick={() => setAddOpen(false)}
              >
                انصراف
              </button>
              <button
                className={primaryButton}
                onClick={() => void addApplication()}
                disabled={!newRole.trim() || !newCompany.trim()}
              >
                افزودن به برد
              </button>
            </div>
          </div>
        </Modal>
      )}
      {deleteCandidate && (
        <DeleteConfirmModal
          itemName={`${deleteCandidate.role} در ${deleteCandidate.company}`}
          description={
            <>
              آیا از حذف این موقعیت شغلی(
              <bdi>{`${deleteCandidate.role} در ${deleteCandidate.company}`}</bdi>
              ) برای پیگیری وضعیت شغلی مطمئن هستی؟
              <span className="mt-1 block text-[11px]">
                (این شغل در لیست فرصت‌های شغلی همچنان باقی خواهد ماند)
              </span>
            </>
          }
          showCloseButton={false}
          onCancel={() => setDeleteCandidate(undefined)}
          onConfirm={() => void removeFromBoard(deleteCandidate)}
        />
      )}
    </>
  );
}
