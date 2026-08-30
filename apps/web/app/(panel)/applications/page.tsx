"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, Plus, Target } from "lucide-react";
import { Modal, SectionTitle } from "../_components/ui";
import { ApplicationsSkeleton } from "../_components/loading-skeletons";
import { useToast } from "@/app/_components/toast";
import { applicationStore, createRecordId } from "@/lib/data/stores";
import type { ApplicationRecord, ApplicationStage } from "@/lib/data/models";
import { formatPersianNumber } from "@/lib/fa-number";

const pipelineStages: Array<{ id: ApplicationStage; title: string }> = [
  { id: "saved", title: "ذخیره‌شده" },
  { id: "applied", title: "ارسال‌شده" },
  { id: "review", title: "در حال بررسی" },
  { id: "interview", title: "مصاحبه" },
];

function formatUpdateTime(date: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default function ApplicationsPage() {
  const notify = useToast();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newCompany, setNewCompany] = useState("");

  const loadPipeline = async () => {
    setLoading(true);
    setError("");
    try {
      setApplications(await applicationStore.list());
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
    applicationStore
      .list()
      .then((records) => {
        if (active) setApplications(records);
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
        pipelineStages.map((stage) => [
          stage.id,
          applications.filter((application) => application.stage === stage.id),
        ]),
      ) as Record<ApplicationStage, ApplicationRecord[]>,
    [applications],
  );

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

  const advance = async (application: ApplicationRecord) => {
    const currentIndex = pipelineStages.findIndex(
      (stage) => stage.id === application.stage,
    );
    if (currentIndex >= pipelineStages.length - 1) {
      notify("این اپلای در آخرین مرحله قرار دارد");
      return;
    }
    const nextStage = pipelineStages[currentIndex + 1];
    const updated = {
      ...application,
      stage: nextStage.id,
      updatedAt: new Date().toISOString(),
    };
    try {
      await applicationStore.put(updated);
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      notify(`اپلای به مرحله «${nextStage.title}» منتقل شد`);
    } catch {
      notify("تغییر مرحله اپلای ناموفق بود.", "error");
    }
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
        description="تمام وضعیت‌ها از اپلای‌هایی ساخته می‌شوند که خودت ثبت کرده‌ای."
        action={
          <button className={primaryButton} onClick={() => setAddOpen(true)}>
            <Plus size={18} /> افزودن اپلای
          </button>
        }
      />
      <div className="mb-4 flex items-center gap-7 rounded-[13px] border border-[#e7ebe6] bg-white px-4 py-3 text-[9px] text-[#71817e] max-[560px]:overflow-x-auto [&_span]:whitespace-nowrap">
        <span>
          <i className="ml-1 inline-block size-1.5 rounded-full bg-[#5a8bb5]" />{" "}
          {formatPersianNumber(applications.length)} اپلای ثبت‌شده
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
        {pipelineStages.map((stage) => (
          <section
            className="min-h-[440px] rounded-[15px] bg-[#eef1ed] p-[10px]"
            key={stage.id}
          >
            <div className="mb-[10px] flex items-center justify-between px-1 py-1">
              <strong className="text-[10px]">{stage.title}</strong>
              <span className="grid size-6 place-items-center rounded-lg bg-white text-[8px] text-[#758582]">
                {formatPersianNumber(groupedApplications[stage.id].length)}
              </span>
            </div>
            {groupedApplications[stage.id].map((application) => (
              <article
                className="mb-2 rounded-xl border border-[#e2e7e2] bg-white p-3 shadow-[0_7px_20px_rgba(27,55,50,.05)]"
                key={application.id}
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-[#e6f4ee] text-[9px] font-bold text-[#0f7b62]">
                    {Array.from(application.company)[0] || "—"}
                  </span>
                  <small className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[8px] text-[#7b8986]">
                    {application.company}
                  </small>
                  <button
                    className="border-0 bg-transparent p-1 text-[#91a09c]"
                    onClick={() => void advance(application)}
                    aria-label="انتقال به مرحله بعد"
                  >
                    <ArrowLeft size={17} />
                  </button>
                </div>
                <h3 className="mb-2 mt-3 text-[10px]">{application.role}</h3>
                {typeof application.match === "number" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#e8f4ef] px-2 py-1 text-[8px] font-bold text-[#0f7b62]">
                    <Target size={12} /> تطابق{" "}
                    {formatPersianNumber(application.match)}٪
                  </span>
                )}
                <footer className="mt-3 flex items-center gap-1 border-t border-[#edf0ec] pt-2 text-[7px] text-[#9aa5a2]">
                  <Clock3 size={13} /> آخرین تغییر{" "}
                  {formatUpdateTime(application.updatedAt)}
                </footer>
              </article>
            ))}
          </section>
        ))}
      </div>
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
    </>
  );
}
