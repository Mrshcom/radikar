"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Download, Eye, FileUp, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn, type SortState } from "@/app/(panel)/_components/data-table";
import { TableActionButton } from "@/app/(panel)/_components/table-action-button";
import { DeleteConfirmModal, Modal, SectionTitle } from "@/app/(panel)/_components/ui";
import { TableFilterSelect, TableToolbar } from "@/app/(panel)/_components/table-controls";
import { TablePagination } from "@/app/(panel)/_components/table-pagination";
import { useToast } from "@/app/_components/toast";
import { apiRequest } from "@/lib/api-client";
import { PersianDateTime } from "@/lib/date-time-display";
import { useUrlTablePagination } from "@/lib/table-page-size";
import {
  employerKeys,
  useEmployerBankResume,
  useEmployerBankResumeFile,
  useEmployerResumeBank,
  useEmployerPosition,
  type EmployerBankResume,
  type EmployerCandidate,
} from "@/lib/employer";

const fileSchema = z.object({
  files: z.custom<FileList>(
    (value) => value instanceof FileList && value.length > 0 && value.length <= 100,
    "۱ تا ۱۰۰ فایل انتخاب کن.",
  ),
});
const resumeDetailsSchema = z.object({
  name: z.string().trim().max(160).nullable(),
  specialty: z.string().trim().max(160).nullable(),
  email: z.string().trim().email("ایمیل معتبر نیست.").max(254).nullable(),
  phone: z.string().trim().max(32).nullable(),
});

type ResumeBankFilters = {
  specialty: "all" | "has_specialty" | "without_specialty";
  contact: "all" | "complete" | "partial" | "missing";
  originalFile: "all" | "available" | "missing";
  extraction: "all" | "ready" | "failed";
  position: string;
  invitation: "all" | "invited" | "not_invited";
  interview: "all" | "participated" | "not_participated" | "completed";
};

const initialFilters: ResumeBankFilters = {
  specialty: "all",
  contact: "all",
  originalFile: "all",
  extraction: "all",
  position: "all",
  invitation: "all",
  interview: "all",
};
const emptyResumes: EmployerBankResume[] = [];

const normalizeSearch = (value: string) =>
  value
    .toLocaleLowerCase("fa-IR")
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632));

const resumeSortValue = (resume: EmployerBankResume, key: string) => {
  switch (key) {
    case "name":
      return resume.name || resume.fileName;
    case "specialty":
      return resume.specialty || "";
    case "phone":
      return resume.phone || "";
    case "createdAt":
      return resume.createdAt;
    default:
      return "";
  }
};

const resumeCollator = new Intl.Collator("fa", { numeric: true, sensitivity: "base" });
type ResumePosition = EmployerBankResume["positions"][number];
const invitationStates: Record<EmployerCandidate["invitationStatus"], { label: string; className: string }> = {
  not_invited: { label: "دعوت نشده", className: "bg-[#f1f4f1] text-[#687a70]" },
  invited: { label: "دعوت ارسال شد", className: "bg-[#edf7f2] text-[#0f7b62]" },
  accepted: { label: "دعوت ارسال شد", className: "bg-[#edf7f2] text-[#0f7b62]" },
  started: { label: "شرکت کرده", className: "bg-[#e9f3fc] text-[#356f9a]" },
  completed: { label: "شرکت کرده", className: "bg-[#e5f4ec] text-[#0f7b62]" },
  expired: { label: "مهلت گذشته", className: "bg-[#fff0ed] text-[#b2513e]" },
};

const newestPositionFirst = (positions: ResumePosition[]) =>
  [...positions].sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt));

function PositionInterviewList({
  positions,
  name,
  onClose,
  onShowReport,
}: {
  positions: ResumePosition[];
  name: string;
  onClose: () => void;
  onShowReport: (association: ResumePosition) => void;
}) {
  return (
    <Modal
      title={`پوزیشن‌ها و مصاحبه‌های ${name}`}
      description={`${positions.length.toLocaleString("fa-IR")} مورد مرتبط با این رزومه`}
      onClose={onClose}
      modalClassName="!w-[min(750px,calc(100vw-32px))] !max-w-[750px]"
      showCloseButton
    >
      <div className="mt-5 grid gap-3">
        {newestPositionFirst(positions).map((item) => (
          <article
            className="rounded-[16px] border border-[#dfeae4] bg-[linear-gradient(125deg,#f7fcf9,#ffffff_58%)] p-4"
            key={item.id}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                <span className="shrink-0 text-[9px] font-bold text-[#83938b]">پوزیشن شغلی:</span>
                <Link
                  href={`/employer/positions/${item.positionId}`}
                  className="min-w-0 truncate text-sm font-black text-[#19312f] no-underline hover:text-[#0f7b62]"
                >
                  {item.positionTitle}
                </Link>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${invitationStates[item.invitationStatus].className}`}
              >
                {invitationStates[item.invitationStatus].label}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-[#e8f0eb] pt-3">
              <dl className="grid grid-cols-2 gap-6 text-[10px]">
              <div>
                <dt className="text-[#85948d]">مهلت پاسخ</dt>
                <dd className="m-0 mt-1 font-bold text-[#456157]">
                  {item.invitationDeadline ? <PersianDateTime value={item.invitationDeadline} /> : "ندارد"}
                </dd>
              </div>
              <div>
                <dt className="text-[#85948d]">آخرین تغییر</dt>
                <dd className="m-0 mt-1 font-bold text-[#456157]"><PersianDateTime value={item.updatedAt} /></dd>
              </div>
              </dl>
              <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/employer/positions/${item.positionId}`}
                className="text-[10px] font-bold text-[#0f7b62] no-underline hover:underline"
              >
                مشاهده پوزیشن
              </Link>
              {item.interviewScore !== null && (
                <button
                  type="button"
                  className="rounded-lg bg-[#e5f4ec] px-2.5 py-1.5 text-[10px] font-bold text-[#0f7b62] hover:bg-[#d9efe2]"
                  onClick={() => onShowReport(item)}
                >
                  نمره {item.interviewScore.toLocaleString("fa-IR")} از ۱۰۰ · گزارش
                </button>
              )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </Modal>
  );
}

function InterviewDetail({
  association,
  name,
  onClose,
}: {
  association: ResumePosition;
  name: string;
  onClose: () => void;
}) {
  const detail = useEmployerPosition(association.positionId);
  const candidate = detail.data?.candidates.find((item) => item.id === association.id);
  const report = candidate?.interviewReport;
  return (
    <Modal
      title={`گزارش مصاحبهٔ ${name}`}
      description={association.positionTitle}
      onClose={onClose}
      wide
      showCloseButton
    >
      {detail.isLoading && <p className="mt-5 text-sm text-[#60766a]">در حال دریافت گزارش...</p>}
      {detail.error && (
        <p role="alert" className="mt-5 text-sm text-red-600">
          {detail.error.message}
        </p>
      )}
      {!detail.isLoading && !detail.error && !report && (
        <p className="mt-5 text-sm text-[#60766a]">گزارش این مصاحبه هنوز آماده نیست.</p>
      )}
      {report && (
        <div className="mt-5 space-y-4 text-sm leading-7 text-[#415b50]">
          <div className="rounded-xl bg-[#edf8f1] p-4">
            <strong className="text-[#0f7b62]">نمره: {report.score.toLocaleString("fa-IR")} از ۱۰۰</strong>
            <p className="mb-0 mt-2 whitespace-pre-wrap">{report.summary}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "نقاط قوت", items: report.strengths },
              { title: "فرصت‌های بهبود", items: report.improvements },
            ].map(({ title, items }) => (
              <div key={title} className="rounded-xl border border-[#dfe9e3] p-4">
                <h3 className="m-0 text-sm font-bold text-[#19312f]">{title}</h3>
                <ul className="mb-0 mt-2 list-disc space-y-1 pr-5">
                  {items.length ? (
                    items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)
                  ) : (
                    <li>موردی ثبت نشده است.</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
          <div>
            <h3 className="m-0 text-sm font-bold text-[#19312f]">پرسش‌ها و پاسخ‌ها</h3>
            <ol className="mb-0 mt-3 space-y-3">
              {(candidate.interviewAnswers ?? []).map((answer, index) => (
                <li key={index} className="rounded-xl border border-[#e2ebe4] p-4">
                  <strong className="block text-[#19312f]">
                    {candidate.conversationQuestions?.[index] || detail.data?.position.interviewQuestions?.[index] || `سؤال ${index + 1}`}
                  </strong>
                  <p className="mb-0 mt-2 whitespace-pre-wrap">{answer || "پاسخی ثبت نشده است."}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ResumePreview({ resume, onClose }: { resume: EmployerBankResume; onClose: () => void }) {
  const text = useEmployerBankResume(resume.id);
  const file = useEmployerBankResumeFile(resume.id, resume.hasOriginalFile);
  const pdfRef = useRef<HTMLIFrameElement>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const isPdf = resume.fileName.toLowerCase().endsWith(".pdf");
  useEffect(() => {
    if (!file.data) return;
    const nextUrl = URL.createObjectURL(file.data);
    if (pdfRef.current) pdfRef.current.src = nextUrl;
    if (downloadRef.current) downloadRef.current.href = nextUrl;
    return () => URL.revokeObjectURL(nextUrl);
  }, [file.data]);
  return (
    <Modal
      title={`پیش نمایش رزومه ${resume.name || resume.fileName}`}
      onClose={onClose}
      wide
      showCloseButton
      modalClassName="max-h-[calc(100dvh-16px)] p-3 pb-3 max-[560px]:p-2.5 max-[560px]:pb-2.5"
    >
      <div className="mt-2">
        {file.isLoading && <p className="text-sm text-[#60766a]">در حال دریافت فایل اصلی...</p>}
        {file.error && (
          <p role="alert" className="rounded-xl bg-[#fff4ec] p-4 text-sm text-[#a25635]">
            {file.error.message}
          </p>
        )}
        {isPdf && file.data && (
          <iframe
            ref={pdfRef}
            className="h-[calc(100dvh-106px)] w-full rounded-xl border border-[#dfe9e3] bg-white"
            title={`پیش‌نمایش ${resume.fileName}`}
          />
        )}
        {!isPdf && file.data && (
          <a
            ref={downloadRef}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0f7b62] px-4 text-sm font-bold text-white no-underline"
            download={resume.fileName}
          >
            <Download size={17} /> دریافت فایل اصلی
          </a>
        )}
        {(!isPdf || !resume.hasOriginalFile) && (
          <div className="mt-4 max-h-[55vh] overflow-auto rounded-xl border border-[#e1ebe4] bg-[#fbfdfb] p-5 text-sm leading-8 text-[#253c32]">
            {text.isLoading ? (
              "در حال دریافت متن رزومه..."
            ) : text.data?.resumeText ? (
              <pre className="m-0 whitespace-pre-wrap break-words font-[inherit]" dir="auto">
                {text.data.resumeText}
              </pre>
            ) : (
              <p>{text.data?.extractionError || "متنی از این رزومه استخراج نشده است."}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function EmployerResumeBankPage() {
  const searchParams = useSearchParams();
  const client = useQueryClient();
  const notify = useToast();
  const bank = useEmployerResumeBank();
  const [preview, setPreview] = useState<EmployerBankResume | null>(null);
  const [editingResume, setEditingResume] = useState<EmployerBankResume | null>(null);
  const [report, setReport] = useState<{ association: ResumePosition; name: string } | null>(null);
  const [positionSummary, setPositionSummary] = useState<{ positions: ResumePosition[]; name: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EmployerBankResume | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ResumeBankFilters>(() => ({
    ...initialFilters,
    position: searchParams.get("position") || "all",
    invitation: searchParams.get("invitation") === "invited" ? "invited" : "all",
  }));
  const [sort, setSort] = useState<SortState>(null);
  const { page, pageSize, setPage, setPageSize, isSaving: pageSizeSaving } = useUrlTablePagination();
  const form = useForm<z.infer<typeof fileSchema>>({ resolver: zodResolver(fileSchema) });
  const detailsForm = useForm<z.infer<typeof resumeDetailsSchema>>({ resolver: zodResolver(resumeDetailsSchema) });
  const field = form.register("files");
  const upload = useMutation({
    mutationFn: (files: FileList) => {
      const body = new FormData();
      Array.from(files).forEach((file) => body.append("files", file));
      return apiRequest<{ count: number; duplicateCount: number }>("/api/employer/resume-bank", {
        method: "POST",
        body,
      });
    },
    onSuccess: async ({ count, duplicateCount }) => {
      form.reset();
      const imported = count.toLocaleString("fa-IR");
      const duplicateNote = duplicateCount ? ` (${duplicateCount.toLocaleString("fa-IR")} تا رزومه تکراری بود)` : "";
      notify(`با موفقیت ${imported} تا رزومه وارد شد${duplicateNote}.`);
      await client.invalidateQueries({ queryKey: employerKeys.resumeBank });
    },
  });
  const remove = useMutation({
    mutationFn: (resume: EmployerBankResume) =>
      apiRequest(`/api/employer/resume-bank/${resume.id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setPendingDelete(null);
      await client.invalidateQueries({ queryKey: employerKeys.resumeBank });
    },
  });
  const updateDetails = useMutation({
    mutationFn: ({ id, values }: { id: string; values: z.infer<typeof resumeDetailsSchema> }) =>
      apiRequest(`/api/employer/resume-bank/${id}`, { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: async () => {
      setEditingResume(null);
      notify("اطلاعات رزومه ذخیره شد.");
      await client.invalidateQueries({ queryKey: employerKeys.resumeBank });
    },
  });
  const selectFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    await field.onChange(event);
    const files = event.target.files;
    if (!files) return;
    const result = fileSchema.safeParse({ files });
    if (!result.success) return form.setError("files", { message: result.error.issues[0]?.message });
    if (Array.from(files).some((file) => !/\.(pdf|docx)$/i.test(file.name) || file.size > 5 * 1024 * 1024))
      return form.setError("files", { message: "فقط PDF یا DOCX تا ۵ مگابایت قابل ورود است." });
    if (Array.from(files).reduce((sum, file) => sum + file.size, 0) > 40 * 1024 * 1024)
      return form.setError("files", { message: "حجم مجموع فایل‌ها باید حداکثر ۴۰ مگابایت باشد." });
    form.clearErrors("files");
    upload.mutate(files);
  };
  const resumes = bank.data ?? emptyResumes;
  const positions = useMemo(() => {
    const found = new Map<string, string>();
    for (const resume of resumes)
      for (const position of resume.positions) found.set(position.positionId, position.positionTitle);
    return [...found].sort((left, right) => resumeCollator.compare(left[1], right[1]));
  }, [resumes]);
  const filteredResumes = useMemo(() => {
    const query = normalizeSearch(search.trim());
    return resumes.filter((resume) => {
      const matchesSearch =
        !query ||
        [
          resume.name,
          resume.specialty,
          resume.fileName,
          resume.email,
          resume.phone,
          ...resume.positions.map((item) => item.positionTitle),
        ]
          .filter(Boolean)
          .some((value) => normalizeSearch(value!).includes(query));
      const contactCount = Number(Boolean(resume.phone)) + Number(Boolean(resume.email));
      const matchesContact =
        filters.contact === "all" ||
        (filters.contact === "complete" && contactCount === 2) ||
        (filters.contact === "partial" && contactCount === 1) ||
        (filters.contact === "missing" && contactCount === 0);
      const matchesSpecialty =
        filters.specialty === "all" ||
        (filters.specialty === "has_specialty" && Boolean(resume.specialty)) ||
        (filters.specialty === "without_specialty" && !resume.specialty);
      const matchesFile =
        filters.originalFile === "all" ||
        (filters.originalFile === "available" && resume.hasOriginalFile) ||
        (filters.originalFile === "missing" && !resume.hasOriginalFile);
      const matchesExtraction =
        filters.extraction === "all" ||
        (filters.extraction === "ready" && !resume.extractionError) ||
        (filters.extraction === "failed" && Boolean(resume.extractionError));
      const linked =
        filters.position === "all"
          ? resume.positions
          : resume.positions.filter((item) => item.positionId === filters.position);
      const invited = linked.some((item) => item.invitationStatus !== "not_invited");
      const participated = linked.some(
        (item) => item.invitationStatus === "started" || item.invitationStatus === "completed",
      );
      const matchesInvitation =
        filters.invitation === "all" ||
        (filters.invitation === "invited" && invited) ||
        (filters.invitation === "not_invited" && !invited);
      const matchesInterview =
        filters.interview === "all" ||
        (filters.interview === "participated" && participated) ||
        (filters.interview === "not_participated" && !participated) ||
        (filters.interview === "completed" && linked.some((item) => item.invitationStatus === "completed"));
      return (
        matchesSearch &&
        matchesContact &&
        matchesSpecialty &&
        matchesFile &&
        matchesExtraction &&
        (filters.position === "all" || linked.length > 0) &&
        matchesInvitation &&
        matchesInterview
      );
    });
  }, [filters, resumes, search]);
  const activeFilterCount = Object.values(filters).filter((value) => value !== "all").length;
  const sortedResumes = useMemo(() => {
    if (!sort) return filteredResumes;
    return filteredResumes
      .map((resume, index) => ({ resume, index }))
      .sort((left, right) => {
        const first = resumeSortValue(left.resume, sort.key);
        const second = resumeSortValue(right.resume, sort.key);
        const comparison = !first ? (!second ? 0 : 1) : !second ? -1 : resumeCollator.compare(first, second);
        return comparison === 0 ? left.index - right.index : sort.direction === "asc" ? comparison : -comparison;
      })
      .map(({ resume }) => resume);
  }, [filteredResumes, sort]);
  const safePage = Math.min(page, Math.max(1, Math.ceil(sortedResumes.length / pageSize)));
  const pageResumes = sortedResumes.slice((safePage - 1) * pageSize, safePage * pageSize);
  const columns: DataTableColumn<EmployerBankResume>[] = [
    {
      key: "name",
      title: "نام",
      className: "lg:w-[16%] lg:max-w-0 truncate text-[10px] font-bold",
      render: (resume) => <span className="block truncate">{resume.name || resume.fileName}</span>,
    },
    {
      key: "specialty",
      title: "تخصص",
      className: "lg:w-[18%] lg:max-w-0 text-[10px]",
      render: (resume) => resume.specialty ? <span className="block line-clamp-2">{resume.specialty}</span> : <span className="text-[#899592]">ثبت نشده</span>,
    },
    {
      key: "phone",
      title: "موبایل",
      className: "lg:w-[13%] whitespace-nowrap text-[10px]",
      render: (resume) =>
        resume.phone ? (
          <a className="text-[#526461] no-underline hover:text-[#0f7b62]" dir="ltr" href={`tel:${resume.phone}`}>
            {resume.phone}
          </a>
        ) : (
          <span className="text-[#899592]">—</span>
        ),
    },
    {
      key: "positions",
      title: "پوزیشن و مصاحبه",
      sortable: false,
      className: "lg:w-[24%] lg:max-w-0 text-[10px]",
      render: (resume) => {
        const linked =
          filters.position === "all"
            ? resume.positions
            : resume.positions.filter((item) => item.positionId === filters.position);
        const invitations = linked.filter((item) => item.invitationStatus !== "not_invited");
        return invitations.length ? (
          <button
            type="button"
            aria-label={`مشاهده جزئیات ${invitations.length.toLocaleString("fa-IR")} دعوت مصاحبهٔ ${resume.name || resume.fileName}`}
            className="inline-flex max-w-full items-center gap-1.5 text-[11px] font-bold text-[#0f7b62] transition hover:text-[#0b6d58] focus-visible:outline-2 focus-visible:outline-[#0f7b62]"
            onClick={() => setPositionSummary({ positions: invitations, name: resume.name || resume.fileName })}
          >
            <span>
              {invitations.length.toLocaleString("fa-IR")}
              {invitations.length === 1 ? " دعوت‌نامه" : " تا دعوت‌نامه"}
            </span>
            <Eye aria-hidden="true" size={14} />
          </button>
        ) : linked.length ? (
          <span className="text-[10px] font-bold text-[#899592]">دعوت نشده</span>
        ) : (
          <span className="text-[#899592]">بدون پوزیشن</span>
        );
      },
    },
    {
      key: "createdAt",
      title: "تاریخ ورود",
      className: "lg:w-[17%] whitespace-nowrap text-[10px]",
      render: (resume) => <PersianDateTime value={resume.createdAt} />,
    },
    {
      key: "actions",
      title: "عملیات",
      sortable: false,
      className: "lg:w-[12%] whitespace-nowrap",
      render: (resume) => (
        <div className="flex items-center gap-1">
          <TableActionButton label={`پیش‌نمایش ${resume.fileName}`} onClick={() => setPreview(resume)}>
            <Eye size={14} />
          </TableActionButton>
          <TableActionButton
            label={`ویرایش اطلاعات ${resume.name || resume.fileName}`}
            onClick={() => {
              detailsForm.reset({ name: resume.name, specialty: resume.specialty, email: resume.email, phone: resume.phone });
              updateDetails.reset();
              setEditingResume(resume);
            }}
          >
            <Pencil size={14} />
          </TableActionButton>
          <TableActionButton
            label={`حذف ${resume.fileName}`}
            disabled={remove.isPending || !resume.canDelete}
            onClick={() => setPendingDelete(resume)}
          >
            <Trash2 size={14} />
          </TableActionButton>
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-6">
      <SectionTitle
        title="بانک رزومه‌ها"
        description="رزومه‌ها، پوزیشن‌های مرتبط، وضعیت دعوت و نتیجهٔ مصاحبه را اینجا ببین. ساخت لینک دعوت به معنی ارسال خودکار آن نیست."
      />
      <section className="rounded-2xl border border-[#dfe9e3] bg-white p-5">
        <form onSubmit={form.handleSubmit(({ files }) => upload.mutate(files))}>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#9bcbb0] bg-[#f7fbf8] px-5 py-7 text-center">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#e1f2e8] text-[#0f7b62]">
              <FileUp size={23} />
            </span>
            <strong className="text-sm text-[#173c30]">ورود دسته‌ای رزومه‌ها</strong>
            <span className="text-xs text-[#648074]">PDF یا DOCX · حداکثر ۱۰۰ فایل در هر نوبت</span>
            <input
              className="sr-only"
              type="file"
              accept=".pdf,.docx"
              multiple
              disabled={upload.isPending}
              {...field}
              onChange={selectFiles}
            />
          </label>
          {upload.isPending && (
            <p className="mt-3 flex items-center gap-2 text-xs text-[#0f7b62]">
              <LoaderCircle className="animate-spin" size={15} /> در حال ورود رزومه‌ها...
            </p>
          )}
          {form.formState.errors.files && (
            <p role="alert" className="mt-3 text-xs text-red-600">
              {form.formState.errors.files.message}
            </p>
          )}
          {upload.error && (
            <p role="alert" className="mt-3 text-xs text-red-600">
              {upload.error.message}
            </p>
          )}
        </form>
      </section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-base font-black text-[#19312f]">فهرست رزومه‌ها</h2>
        <span className="text-xs text-[#6d8176]">
          {filteredResumes.length.toLocaleString("fa-IR")} از {resumes.length.toLocaleString("fa-IR")} رزومه
        </span>
      </div>
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <TableToolbar
          activeFilterCount={activeFilterCount}
          onResetFilters={() => {
            setFilters(initialFilters);
            setPage(1);
          }}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          search={search}
          searchPlaceholder="نام، تخصص، ایمیل، موبایل یا نام فایل..."
        >
          <TableFilterSelect
            label="پوزیشن"
            onChange={(position) => {
              setFilters((current) => ({ ...current, position }));
              setPage(1);
            }}
            options={[
              { value: "all", label: "همهٔ پوزیشن‌ها" },
              ...positions.map(([value, label]) => ({ value, label })),
            ]}
            value={filters.position}
          />
          <TableFilterSelect
            label="دعوت به مصاحبه"
            onChange={(invitation) => {
              setFilters((current) => ({ ...current, invitation: invitation as ResumeBankFilters["invitation"] }));
              setPage(1);
            }}
            options={[
              { value: "all", label: "همه" },
              { value: "invited", label: "لینک ساخته‌شده" },
              { value: "not_invited", label: "بدون دعوت" },
            ]}
            value={filters.invitation}
          />
          <TableFilterSelect
            label="شرکت در مصاحبه"
            onChange={(interview) => {
              setFilters((current) => ({ ...current, interview: interview as ResumeBankFilters["interview"] }));
              setPage(1);
            }}
            options={[
              { value: "all", label: "همه" },
              { value: "participated", label: "شرکت‌کرده" },
              { value: "not_participated", label: "شرکت‌نکرده" },
              { value: "completed", label: "تکمیل‌شده و نمره‌دار" },
            ]}
            value={filters.interview}
          />
          <TableFilterSelect
            label="تخصص استخراج‌شده"
            onChange={(specialty) => {
              setFilters((current) => ({ ...current, specialty: specialty as ResumeBankFilters["specialty"] }));
              setPage(1);
            }}
            options={[
              { value: "all", label: "همه" },
              { value: "has_specialty", label: "دارای تخصص" },
              { value: "without_specialty", label: "بدون تخصص" },
            ]}
            value={filters.specialty}
          />
          <TableFilterSelect
            label="اطلاعات تماس"
            onChange={(contact) => {
              setFilters((current) => ({ ...current, contact: contact as ResumeBankFilters["contact"] }));
              setPage(1);
            }}
            options={[
              { value: "all", label: "همه" },
              { value: "complete", label: "موبایل و ایمیل" },
              { value: "partial", label: "ناقص" },
              { value: "missing", label: "بدون اطلاعات تماس" },
            ]}
            value={filters.contact}
          />
          <TableFilterSelect
            label="فایل اصلی"
            onChange={(originalFile) => {
              setFilters((current) => ({
                ...current,
                originalFile: originalFile as ResumeBankFilters["originalFile"],
              }));
              setPage(1);
            }}
            options={[
              { value: "all", label: "همه" },
              { value: "available", label: "قابل پیش‌نمایش" },
              { value: "missing", label: "فقط متن استخراج‌شده" },
            ]}
            value={filters.originalFile}
          />
          <TableFilterSelect
            label="وضعیت استخراج"
            onChange={(extraction) => {
              setFilters((current) => ({ ...current, extraction: extraction as ResumeBankFilters["extraction"] }));
              setPage(1);
            }}
            options={[
              { value: "all", label: "همه" },
              { value: "ready", label: "موفق" },
              { value: "failed", label: "نیازمند بررسی" },
            ]}
            value={filters.extraction}
          />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={pageResumes}
          getRowKey={(resume) => resume.id}
          loading={bank.isLoading}
          error={bank.error}
          retrying={bank.isFetching}
          onRetry={() => void bank.refetch()}
          filtered={Boolean(search || activeFilterCount)}
          sort={sort}
          onSortChange={(next) => {
            setSort(next);
            setPage(1);
          }}
          minWidthClassName="min-w-0 table-fixed"
          footer={
            <TablePagination
              page={safePage}
              pageSize={pageSize}
              total={filteredResumes.length}
              pageSizeSaving={pageSizeSaving}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          }
        />
      </section>
      {preview && <ResumePreview resume={preview} onClose={() => setPreview(null)} />}
      {editingResume && (
        <Modal title="ویرایش اطلاعات رزومه" description="اصلاح دستی اطلاعات استخراج‌شده از رزومه" onClose={() => setEditingResume(null)} showCloseButton>
          <form className="mt-5 grid gap-4" onSubmit={detailsForm.handleSubmit((values) => updateDetails.mutate({ id: editingResume.id, values }))}>
            {([['name', 'نام کارجو'], ['specialty', 'تخصص'], ['email', 'ایمیل'], ['phone', 'شماره همراه']] as const).map(([field, label]) => (
              <label className="grid gap-1.5 text-xs font-bold text-[#456157]" key={field}>
                {label}
                <input className="min-h-11 rounded-xl border border-[#d8e6de] bg-white px-3 text-sm font-normal outline-none focus:border-[#0f7b62]" dir={field === 'email' || field === 'phone' ? 'ltr' : 'rtl'} {...detailsForm.register(field, { setValueAs: (value) => value.trim() || null })} />
                {detailsForm.formState.errors[field] && <span className="text-[10px] text-[#b2513e]">{detailsForm.formState.errors[field]?.message}</span>}
              </label>
            ))}
            <button className="min-h-11 rounded-xl bg-[#0f7b62] px-5 text-xs font-bold text-white disabled:opacity-50" disabled={updateDetails.isPending} type="submit">
              {updateDetails.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </form>
        </Modal>
      )}
      {report && (
        <InterviewDetail association={report.association} name={report.name} onClose={() => setReport(null)} />
      )}
      {positionSummary && (
        <PositionInterviewList
          name={positionSummary.name}
          onClose={() => setPositionSummary(null)}
          onShowReport={(association) => {
            setPositionSummary(null);
            setReport({ association, name: positionSummary.name });
          }}
          positions={positionSummary.positions}
        />
      )}
      {pendingDelete && (
        <DeleteConfirmModal
          itemName={pendingDelete.name || pendingDelete.fileName}
          description="این رزومه هنوز به مصاحبه دعوت نشده است و با حذف آن، از بانک رزومه و پوزیشن‌های مرتبط پاک می‌شود."
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => remove.mutate(pendingDelete)}
        />
      )}
    </div>
  );
}
