"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, Plus, Target } from "lucide-react";
import { Modal, SectionTitle } from "../_components/ui";
import { ApplicationsSkeleton } from "../_components/loading-skeletons";
import { useToast } from "../_components/panel-shell";
import { applicationStore, createRecordId } from "@/lib/data/stores";
import type { ApplicationRecord, ApplicationStage } from "@/lib/data/models";

const pipelineStages: Array<{ id: ApplicationStage; title: string }> = [
  { id: "saved", title: "ذخیره‌شده" },
  { id: "applied", title: "ارسال‌شده" },
  { id: "review", title: "در حال بررسی" },
  { id: "interview", title: "مصاحبه" },
];

function formatUpdateTime(date: string) {
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(date));
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
      setError(event instanceof Error ? event.message : "خواندن اپلای‌های ذخیره‌شده ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    applicationStore.list()
      .then((records) => {
        if (active) setApplications(records);
      })
      .catch((event: unknown) => {
        if (active) setError(event instanceof Error ? event.message : "خواندن اپلای‌های ذخیره‌شده ناموفق بود.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const groupedApplications = useMemo(() => Object.fromEntries(
    pipelineStages.map((stage) => [stage.id, applications.filter((application) => application.stage === stage.id)]),
  ) as Record<ApplicationStage, ApplicationRecord[]>, [applications]);

  const responseStats = useMemo(() => {
    const sent = applications.filter((application) => application.stage !== "saved");
    const responded = sent.filter((application) => application.stage === "review" || application.stage === "interview");
    const responseDays = responded
      .filter((application) => application.appliedAt)
      .map((application) => Math.max(0, Math.round((new Date(application.updatedAt).getTime() - new Date(application.appliedAt!).getTime()) / 86400000)));
    return {
      rate: sent.length ? `${Math.round((responded.length / sent.length) * 100)}٪` : "—",
      average: responseDays.length ? `${Math.round(responseDays.reduce((sum, day) => sum + day, 0) / responseDays.length)} روز` : "—",
    };
  }, [applications]);

  const addApplication = async () => {
    if (!newRole.trim() || !newCompany.trim()) return;
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
    await applicationStore.put(application);
    setApplications((current) => [application, ...current]);
    setAddOpen(false);
    setNewRole("");
    setNewCompany("");
    notify("اپلای جدید ذخیره شد");
  };

  const advance = async (application: ApplicationRecord) => {
    const currentIndex = pipelineStages.findIndex((stage) => stage.id === application.stage);
    if (currentIndex >= pipelineStages.length - 1) {
      notify("این اپلای در آخرین مرحله قرار دارد");
      return;
    }
    const nextStage = pipelineStages[currentIndex + 1];
    const updated = { ...application, stage: nextStage.id, updatedAt: new Date().toISOString() };
    await applicationStore.put(updated);
    setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
    notify(`اپلای به مرحله «${nextStage.title}» منتقل شد`);
  };

  if (loading) return <ApplicationsSkeleton />;
  if (error) return <div className="empty-results"><Target size={34} /><h3>خواندن اپلای‌ها ناموفق بود</h3><p>{error}</p><button className="secondary-btn" onClick={loadPipeline}>تلاش دوباره</button></div>;

  return <><SectionTitle title="پیگیری اپلای‌ها" description="تمام وضعیت‌ها از اپلای‌هایی ساخته می‌شوند که خودت ثبت کرده‌ای." action={<button className="primary-btn" onClick={() => setAddOpen(true)}><Plus size={18} /> افزودن اپلای</button>} /><div className="pipeline-summary"><span><i className="dot blue-dot" /> {applications.length} اپلای ثبت‌شده</span><span>نرخ پاسخ <strong>{responseStats.rate}</strong></span><span>میانگین پاسخ <strong>{responseStats.average}</strong></span></div><div className="kanban">{pipelineStages.map((stage) => <section className="kanban-column" key={stage.id}><div className="kanban-head"><strong>{stage.title}</strong><span>{groupedApplications[stage.id].length}</span></div>{groupedApplications[stage.id].map((application) => <article className="kanban-card" key={application.id}><div><span className="tiny-company">{Array.from(application.company)[0] || "—"}</span><small>{application.company}</small><button onClick={() => void advance(application)} aria-label="انتقال به مرحله بعد"><ArrowLeft size={17} /></button></div><h3>{application.role}</h3>{typeof application.match === "number" && <span className="match-pill"><Target size={12} /> تطابق {application.match}٪</span>}<footer><Clock3 size={13} /> آخرین تغییر {formatUpdateTime(application.updatedAt)}</footer></article>)}</section>)}</div>{addOpen && <Modal title="افزودن اپلای" description="فقط فرصت‌هایی را ثبت کن که واقعاً برایشان اقدام کرده‌ای." onClose={() => setAddOpen(false)}><div className="form-stack"><label>عنوان موقعیت<input value={newRole} onChange={(event) => setNewRole(event.target.value)} placeholder="عنوان موقعیت" /></label><label>نام شرکت<input value={newCompany} onChange={(event) => setNewCompany(event.target.value)} placeholder="نام شرکت" /></label><div className="modal-actions"><button className="secondary-btn" onClick={() => setAddOpen(false)}>انصراف</button><button className="primary-btn" onClick={() => void addApplication()} disabled={!newRole.trim() || !newCompany.trim()}>افزودن به برد</button></div></div></Modal>}</>;
}
