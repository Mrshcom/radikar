"use client";

import { InterviewReportView } from "@/app/(panel)/interview/interview-result";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  Database,
  Pencil,
  ClipboardCopy,
  ChevronDown,
  FileUp,
  Eye,
  LoaderCircle,
  Phone,
  SearchCheck,
  Search,
  Send,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { z } from "zod";
import { normalizeIranianMobile } from "@radikar/validators";
import { ApiError, apiRequest } from "@/lib/api-client";
import { useRadicoinWallet } from "@/lib/radicoins";
import {
  employerKeys,
  positionWorkflowBadge,
  useEmployerPosition,
  useEmployerResumeBank,
  type EmployerCandidate,
} from "@/lib/employer";
import { DeleteConfirmModal, Modal, SectionTitle } from "@/app/(panel)/_components/ui";
import { useToast } from "@/app/_components/toast";
import { JalaliDatePicker } from "@/app/(panel)/_components/jalali-date-picker";
import { TimePicker } from "@/app/(panel)/_components/time-picker";
import { Checkbox } from "@/app/_components/checkbox";
import { EmployerResumePreview } from "./resume-preview";
import { availableHiringStep, HiringWorkflow } from "../_components/hiring-workflow";

const fileSchema = z.object({
  files: z.custom<FileList>(
    (value) => typeof FileList !== "undefined" && value instanceof FileList && value.length > 0 && value.length <= 100,
    "۱ تا ۱۰۰ فایل رزومه انتخاب کن.",
  ),
});
const inviteSchema = z
  .object({
    deadlineDate: z.string().min(1, "تاریخ مهلت مصاحبه را مشخص کن."),
    deadlineTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "ساعت مهلت مصاحبه را مشخص کن."),
  })
  .refine(
    ({ deadlineDate, deadlineTime }) =>
      new Date(`${deadlineDate}T${deadlineTime}:00+03:30`).getTime() >= Date.now() + 60 * 60_000,
    { path: ["deadlineDate"], message: "مهلت مصاحبه باید دست‌کم یک ساعت از اکنون بیشتر باشد." },
  );
const mobileFormSchema = z.object({
  phone: z
    .string()
    .trim()
    .refine((value) => normalizeIranianMobile(value) !== null, "شماره همراه معتبر وارد کن."),
});

function candidateLabel(candidate: EmployerCandidate) {
  return candidate.name || candidate.fileName;
}

function statusLabel(candidate: EmployerCandidate) {
  if (candidate.screeningStatus === "ready") return "بررسی‌شده";
  if (candidate.screeningStatus === "duplicate") return "تکراری";
  if (candidate.screeningStatus === "unreadable") return "غیرقابل‌خواندن";
  if (candidate.screeningStatus === "failed") return "خطای پایش";
  return "در انتظار پایش";
}

function invitationPresentation(status: EmployerCandidate["invitationStatus"]) {
  if (status === "completed") return { label: "شرکت کرده", tone: "bg-[#e7f5ee] text-[#0f7b62]" };
  if (status === "started") return { label: "شرکت کرده", tone: "bg-[#fff3df] text-[#936122]" };
  if (status === "accepted") return { label: "دعوت ارسال شد", tone: "bg-[#edf7f2] text-[#0f7b62]" };
  if (status === "expired") return { label: "مهلت گذشته", tone: "bg-[#fff0ed] text-[#ad523f]" };
  if (status === "invited") return { label: "دعوت ارسال شد", tone: "bg-[#edf7f2] text-[#0f7b62]" };
  return { label: "آمادهٔ انتخاب", tone: "bg-[#f2f5f3] text-[#63766f]" };
}

function EmployerActionError({ error, balance, cost }: { error: Error; balance?: number; cost: number }) {
  const insufficientCoins = error instanceof ApiError && error.code === "INSUFFICIENT_RADICOIN";
  return (
    <div role="alert" className="rounded-xl border border-[#ecd6b6] bg-[#fffbf3] p-4 text-right text-sm text-[#72502b] mt-2">
      <div className="flex items-start gap-2">
        <CircleAlert className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <strong className="block">{insufficientCoins ? "رادیکوین کافی نداری" : "انجام عملیات ناموفق بود"}</strong>
          <p className="mb-0 mt-1 text-xs leading-6">{error.message}</p>
          {insufficientCoins && (
            <>
              <p className="mb-0 mt-2 text-xs leading-6">
                هزینهٔ این مرحله: {cost.toLocaleString("fa-IR")} رادیکوین
                {balance !== undefined ? ` · موجودی فعلی: ${balance.toLocaleString("fa-IR")}` : ""}
              </p>
              <Link
                className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#d5b889] bg-white px-3 text-xs font-bold text-[#755022] no-underline"
                href="/radicoins"
              >
                مشاهدهٔ کیف پول <ArrowLeft size={14} />
              </Link>
            </>
          )}
          {!insufficientCoins && (
            <p className="mb-0 mt-2 text-xs leading-6">
              جزئیات را بررسی کن و دوباره تلاش کن. اگر خطا ادامه داشت، با پشتیبانی تماس بگیر.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmployerPositionPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const client = useQueryClient();
  const notify = useToast();
  const detail = useEmployerPosition(id);
  const wallet = useRadicoinWallet();
  const [selected, setSelected] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const [screeningErrorDismissed, setScreeningErrorDismissed] = useState(true);
  const [links, setLinks] = useState<
    Array<{
      candidateId: string;
      name: string | null;
      url: string;
      delivery: "in_app" | "sms_sent" | "sms_unavailable" | "sms_failed";
    }>
  >([]);
  const [copied, setCopied] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [phoneCandidateId, setPhoneCandidateId] = useState<string | null>(null);
  const [resendCandidateId, setResendCandidateId] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [bankSelected, setBankSelected] = useState<string[]>([]);
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [resumeSource, setResumeSource] = useState<"device" | "bank">("device");
  const [viewStep, setViewStep] = useState<1 | 2 | 3 | 4 | null>(() => {
    const step = searchParams.get("step");
    return step === "1" || step === "2" || step === "3" || step === "4" ? (Number(step) as 1 | 2 | 3 | 4) : null;
  });
  const filesForm = useForm<z.infer<typeof fileSchema>>({ resolver: zodResolver(fileSchema) });
  const filesField = filesForm.register("files");
  const inviteForm = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { deadlineDate: "", deadlineTime: "23:59" },
  });
  const resendForm = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { deadlineDate: "", deadlineTime: "23:59" },
  });
  const mobileForm = useForm<z.infer<typeof mobileFormSchema>>({
    resolver: zodResolver(mobileFormSchema),
    defaultValues: { phone: "" },
  });
  const selectedFiles = useWatch({ control: filesForm.control, name: "files" });
  const candidates = detail.data?.candidates ?? [];
  const resumeBank = useEmployerResumeBank(
    Boolean(detail.data && (detail.data.position.workflowStage === 2 || viewStep === 2) && resumeSource === "bank"),
  );
  const selectedCount = selectedFiles?.length ?? 0;
  const remainingSlots = Math.max(0, 100 - candidates.length);
  const screenedCandidates = [...candidates]
    .filter((candidate) => candidate.screeningStatus === "ready")
    .sort((a, b) => (b.matchEvidence?.score ?? 0) - (a.matchEvidence?.score ?? 0));
  const selectableCandidates =
    detail.data?.position.screeningStatus === "completed"
      ? [
          ...screenedCandidates,
          ...candidates.filter(
            (candidate) => candidate.invitationStatus !== "not_invited" && candidate.screeningStatus !== "ready",
          ),
        ]
      : detail.data?.position.screeningStatus === "processing"
        ? []
        : candidates;

  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      const body = new FormData();
      for (const file of Array.from(files)) body.append("files", file);
      return apiRequest<{ count: number }>(`/api/employer/positions/${id}/resumes`, { method: "POST", body });
    },
    onSuccess: async ({ count }) => {
      filesForm.reset();
      notify(`${count.toLocaleString("fa-IR")} رزومه به این پوزیشن اضافه شد.`);
      await client.invalidateQueries({ queryKey: employerKeys.position(id) });
    },
  });
  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    await filesField.onChange(event);
    upload.reset();
    const files = event.target.files;
    if (!files?.length) return;
    const validation = fileSchema.safeParse({ files });
    if (!validation.success) {
      filesForm.setError("files", { message: validation.error.issues[0]?.message });
      return;
    }
    if (files.length > remainingSlots) {
      filesForm.setError("files", { message: "تعداد فایل‌ها از ظرفیت باقی‌مانده بیشتر است." });
      return;
    }
    if (Array.from(files).some((file) => file.size > 5 * 1024 * 1024)) {
      filesForm.setError("files", { message: "حجم هر فایل باید حداکثر ۵ مگابایت باشد." });
      return;
    }
    if (Array.from(files).reduce((total, file) => total + file.size, 0) > 40 * 1024 * 1024) {
      filesForm.setError("files", { message: "حجم مجموع فایل‌های این نوبت باید حداکثر ۴۰ مگابایت باشد." });
      return;
    }
    filesForm.clearErrors("files");
  };
  const removeResume = useMutation({
    mutationFn: (candidateId: string) =>
      apiRequest(`/api/employer/positions/${id}/resumes/${candidateId}`, { method: "DELETE" }),
    onSuccess: async (_result, candidateId) => {
      setDeleteId(null);
      setSelected((current) => current.filter((value) => value !== candidateId));
      await client.invalidateQueries({ queryKey: employerKeys.position(id) });
    },
  });
  const saveCandidatePhone = useMutation({
    mutationFn: ({ candidateId, phone }: { candidateId: string; phone: string }) =>
      apiRequest(`/api/employer/positions/${id}/resumes/${candidateId}/contact`, {
        method: "PATCH",
        body: JSON.stringify({ phone: normalizeIranianMobile(phone) }),
      }),
    onSuccess: async () => {
      setPhoneCandidateId(null);
      mobileForm.reset();
      notify("شماره همراه نامزد و رزومه ذخیره شد.");
      await Promise.all([
        client.invalidateQueries({ queryKey: employerKeys.position(id) }),
        client.invalidateQueries({ queryKey: employerKeys.resumeBank }),
      ]);
    },
  });
  const importFromBank = useMutation({
    mutationFn: () =>
      apiRequest<{ count: number }>(`/api/employer/positions/${id}/resume-bank`, {
        method: "POST",
        body: JSON.stringify({ resumeIds: bankSelected }),
      }),
    onSuccess: async ({ count }) => {
      setBankSelected([]);
      setBankPickerOpen(false);
      notify(`${count.toLocaleString("fa-IR")} رزومه از بانک به این پوزیشن اضافه شد.`);
      await client.invalidateQueries({ queryKey: employerKeys.position(id) });
    },
  });
  const continueFlow = useMutation({
    mutationFn: () => apiRequest(`/api/employer/positions/${id}/continue`, { method: "POST" }),
    onSuccess: async () => {
      setViewStep(null);
      await client.invalidateQueries({ queryKey: employerKeys.position(id) });
    },
  });
  const chooseReview = useMutation({
    mutationFn: (method: "manual" | "smart") =>
      apiRequest(`/api/employer/positions/${id}/review-method`, {
        method: "POST",
        body: JSON.stringify({ method }),
      }),
    onSuccess: async (_position, method) => {
      setViewStep(method === "smart" ? 3 : null);
      await client.invalidateQueries({ queryKey: employerKeys.position(id) });
    },
  });
  const screen = useMutation({
    mutationFn: async () => {
      if (detail.data?.position.screeningStatus !== "processing")
        await apiRequest(`/api/employer/positions/${id}/screen`, { method: "POST" });
      for (let attempt = 0; attempt < 110; attempt += 1) {
        const state = await apiRequest<{ status: string; processed: number; total: number }>(
          `/api/employer/positions/${id}/screen/next`,
          { method: "POST" },
        );
        setProgress({ processed: state.processed, total: state.total });
        await client.invalidateQueries({ queryKey: employerKeys.position(id) });
        if (state.status !== "processing") return state;
      }
      throw new Error("پایش هنوز کامل نشده است؛ با دکمهٔ ادامه پایش، آن را دنبال کن.");
    },
    onSettled: async () => {
      setViewStep(null);
      await client.invalidateQueries({ queryKey: employerKeys.position(id) });
      await wallet.refetch();
    },
  });
  const invite = useMutation({
    mutationFn: ({ deadlineDate, deadlineTime }: z.infer<typeof inviteSchema>) =>
      apiRequest<{ invitations: typeof links }>(`/api/employer/positions/${id}/invitations`, {
        method: "POST",
        body: JSON.stringify({
          candidateIds: selected,
          deadline: new Date(`${deadlineDate}T${deadlineTime}:00+03:30`).toISOString(),
        }),
      }),
    onSuccess: async (result) => {
      setLinks(result.invitations);
      setSelected([]);
      await client.invalidateQueries({ queryKey: employerKeys.position(id) });
      await wallet.refetch();
    },
    onError: async () => {
      await wallet.refetch();
    },
  });
  const renewLink = useMutation({
    mutationFn: ({ candidateId, deadline }: { candidateId: string; deadline?: string }) =>
      apiRequest<(typeof links)[number]>(
        `/api/employer/positions/${id}/invitations/${candidateId}/link`,
        { method: "POST", body: deadline ? JSON.stringify({ deadline }) : undefined },
      ),
    onSuccess: async (link) => {
      setLinks((current) => [...current.filter((item) => item.candidateId !== link.candidateId), link]);
      setResendCandidateId(null);
      resendForm.reset();
      notify("دعوت با مهلت تازه دوباره ارسال شد.");
      await Promise.all([
        client.invalidateQueries({ queryKey: employerKeys.position(id) }),
        wallet.refetch(),
      ]);
    },
    onError: async () => {
      await wallet.refetch();
    },
  });

  const dismissWorkflowErrors = () => {
    screen.reset();
    chooseReview.reset();
    setScreeningErrorDismissed(true);
  };
  const navigateStep = (step: 1 | 2 | 3 | 4) => {
    dismissWorkflowErrors();
    setViewStep(step);
  };
  const selectReviewMethod = (method: "manual" | "smart") => {
    dismissWorkflowErrors();
    chooseReview.mutate(method);
  };
  const startScreening = () => {
    screen.reset();
    setScreeningErrorDismissed(false);
    screen.mutate();
  };

  if (detail.isLoading) return <p className="text-sm text-[#698073]">در حال دریافت پوزیشن...</p>;
  if (detail.error || !detail.data)
    return (
      <p role="alert" className="text-sm text-red-600">
        {detail.error?.message || "پوزیشن پیدا نشد."}
      </p>
    );
  const { position, costs } = detail.data;
  const bankResumes = (resumeBank.data ?? []).filter(
    (resume) => !candidates.some((candidate) => candidate.resumeBankId === resume.id),
  );
  const screenInsufficient =
    !screeningErrorDismissed && screen.error instanceof ApiError && screen.error.code === "INSUFFICIENT_RADICOIN";
  const selectedReviewMethod = position.reviewMethod ?? (position.screeningStatus !== "not_started" ? "smart" : null);
  const screeningFailure =
    selectedReviewMethod === "manual" || screeningErrorDismissed
      ? null
      : (screen.error?.message ?? position.screeningError);
  const processed = candidates.filter((candidate) => candidate.screeningStatus !== "pending").length;
  const hasInvitations = candidates.some((candidate) => candidate.invitationStatus !== "not_invited");
  const reviewMethodLocked = position.screeningStatus !== "not_started" && position.screeningStatus !== "failed";
  const availableStep = availableHiringStep(position, candidates);
  const visibleStep = viewStep && viewStep <= availableStep ? viewStep : availableStep;
  const goForward = () => {
    if (visibleStep === 1) navigateStep(2);
    else if (visibleStep === 2 && selectedCount === 0) {
      if (availableStep > 2) navigateStep(3);
      else continueFlow.mutate();
    } else if (visibleStep === 3 && availableStep === 4) navigateStep(4);
  };
  const bankMatches = bankResumes.filter((resume) =>
    `${resume.name ?? ""} ${resume.specialty ?? ""} ${resume.fileName}`
      .toLocaleLowerCase("fa-IR")
      .includes(bankSearch.trim().toLocaleLowerCase("fa-IR")),
  );
  const phoneCandidate = candidates.find((candidate) => candidate.id === phoneCandidateId);
  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-1 text-xs font-bold text-[#0f7b62]" href="/employer/positions">
        <ArrowRight size={15} aria-hidden="true" /> همهٔ پوزیشن‌ها
      </Link>
      <SectionTitle
        title={position.title}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-4 py-2 text-xs font-bold ${positionWorkflowBadge(position).className}`}>
              {positionWorkflowBadge(position).label}
            </span>
            {hasInvitations && (
              <Link
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#cfe3d8] bg-white px-4 text-xs font-bold text-[#0f7b62] no-underline"
                href={`/employer/resume-bank?position=${id}&invitation=invited`}
              >
                <SearchCheck size={16} aria-hidden="true" /> پیگیری مصاحبه‌ها
              </Link>
            )}
            {position.screeningStatus === "not_started" && !hasInvitations && (
              <Link
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#cfe3d8] bg-white px-4 text-xs font-bold text-[#0f7b62] no-underline"
                href={`/employer/positions/${id}/edit`}
              >
                <Pencil size={15} /> ویرایش پوزیشن
              </Link>
            )}
          </div>
        }
      />
      <HiringWorkflow currentStep={visibleStep} availableStep={availableStep} onStepChange={navigateStep} />
      {visibleStep === 1 && (
        <section className="rounded-[20px] border border-[#dfe9e3] bg-white p-5">
          <h2 className="mb-3 mt-0 text-lg font-bold text-[#19312f]">اطلاعات پوزیشن</h2>
          <dl className="mb-0 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[#71847b]">عنوان</dt>
              <dd className="m-0 mt-1 font-bold">{position.title}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#71847b]">شرکت</dt>
              <dd className="m-0 mt-1 font-bold">{position.companyName}</dd>
            </div>
          </dl>
          <p className="mb-0 mt-4 whitespace-pre-wrap border-t border-[#edf1ec] pt-4 text-sm leading-8 text-[#526c5e]">
            {position.description}
          </p>
          {position.screeningStatus === "not_started" && !hasInvitations ? (
            <Link
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#cfe3d8] px-4 text-xs font-bold text-[#0f7b62] no-underline"
              href={`/employer/positions/${id}/edit`}
            >
              <Pencil size={15} /> ویرایش اطلاعات
            </Link>
          ) : (
            <p className="mb-0 mt-4 text-xs leading-6 text-[#816145]">
              پس از شروع پایش یا ساخت دعوت، ویرایش اطلاعات پوزیشن قفل می‌شود تا نتیجه‌ها و لینک‌ها معتبر بمانند.
            </p>
          )}
        </section>
      )}
      {availableStep > 2 && visibleStep > 2 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#dfe9e3] bg-white px-5 py-4">
          <p className="m-0 text-sm text-[#526c5e]">
            {candidates.length.toLocaleString("fa-IR")} رزومه برای این پوزیشن ثبت شده است.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {position.screeningStatus === "not_started" && position.reviewMethod === "manual" && !hasInvitations && (
              <button
                className="text-xs font-bold text-[#0f7b62]"
                type="button"
                disabled={chooseReview.isPending}
                onClick={() => selectReviewMethod("smart")}
              >
                تغییر به پایش هوشمند
              </button>
            )}
            <button className="text-xs font-bold text-[#0f7b62]" type="button" onClick={() => navigateStep(2)}>
              {position.screeningStatus !== "not_started" || hasInvitations ? "مرور رزومه‌ها" : "ویرایش رزومه‌ها"}
            </button>
          </div>
        </div>
      )}
      {visibleStep === 4 && chooseReview.error && <EmployerActionError error={chooseReview.error} cost={0} />}
      <div className="flex flex-col gap-5">
        <div className="contents">
          {visibleStep === 2 && (
            <section id="resumes" className="order-1 scroll-mt-24 rounded-[20px] border border-[#dfe9e3] bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <FileUp className="text-[#0f7b62]" size={22} />
                <div>
                  <h2 className="m-0 text-lg font-bold">افزودن رزومه‌ها</h2>
                </div>
                <span className="mr-auto rounded-full bg-[#e7f5ed] px-3 py-1 text-xs font-bold text-[#0f7b62]">
                  {candidates.length.toLocaleString("fa-IR")} رزومه واردشده
                </span>
              </div>
              <p className="mb-4 mt-0 text-xs leading-6 text-[#6b8174]">
                رزومه‌ها را از دستگاه یا بانک رزومه اضافه کن. فایل‌های جدید در بانک رزومه هم ذخیره می‌شوند.
              </p>
              {position.screeningStatus === "not_started" && !hasInvitations && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="منبع رزومه">
                    <button
                      type="button"
                      aria-pressed={resumeSource === "device"}
                      className={`rounded-2xl border p-4 text-right ${resumeSource === "device" ? "border-[#8bc9ad] bg-[#edf8f1]" : "border-[#dfe9e3] bg-white"}`}
                      onClick={() => setResumeSource("device")}
                    >
                      <span className="flex items-center gap-2">
                        <FileUp className="shrink-0 text-[#0f7b62]" size={22} />
                        <strong className="text-sm text-[#19312f]">آپلود از دستگاه</strong>
                      </span>
                      <span className="mt-2 block text-xs text-[#6b8174]">فایل PDF یا DOCX جدید را انتخاب کن.</span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={resumeSource === "bank"}
                      className={`rounded-2xl border p-4 text-right ${resumeSource === "bank" ? "border-[#8bc9ad] bg-[#edf8f1]" : "border-[#dfe9e3] bg-white"}`}
                      onClick={() => setResumeSource("bank")}
                    >
                      <span className="flex items-center gap-2">
                        <Database className="shrink-0 text-[#0f7b62]" size={22} />
                        <strong className="text-sm text-[#19312f]">انتخاب از بانک رزومه</strong>
                      </span>
                      <span className="mt-2 block text-xs text-[#6b8174]">
                        رزومهٔ موجود را بدون آپلود دوباره اضافه کن.
                      </span>
                    </button>
                  </div>
                  {resumeSource === "bank" ? (
                    <div className="rounded-2xl border border-[#dfe9e3] bg-[#fbfdfb] p-4">
                      <p className="mt-0 text-xs leading-6 text-[#6b8174]">
                        {bankResumes.length.toLocaleString("fa-IR")} رزومهٔ قابل افزودن در بانک داری.
                      </p>
                      <button
                        className="min-h-10 rounded-xl border border-[#b9d8c5] bg-white px-4 text-sm font-bold text-[#0f7b62]"
                        type="button"
                        onClick={() => setBankPickerOpen(true)}
                      >
                        جست‌وجو و انتخاب رزومه‌ها
                      </button>
                    </div>
                  ) : (
                    <form
                      className="space-y-3"
                      onSubmit={filesForm.handleSubmit((values) => upload.mutate(values.files))}
                    >
                      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#9bcbb0] bg-[#f7fbf8] px-5 py-8 text-center transition-colors hover:bg-[#edf7f0] focus-within:ring-2 focus-within:ring-[#0f7b62]">
                        <span className="grid size-12 place-items-center rounded-2xl bg-[#e1f2e8] text-[#0f7b62]">
                          <FileUp size={25} />
                        </span>
                        <strong className="text-sm text-[#173c30]">انتخاب رزومه‌ها از دستگاه</strong>
                        <span className="text-xs text-[#648074]">
                          فایل‌های PDF یا DOCX · حداکثر {remainingSlots.toLocaleString("fa-IR")} فایل دیگر · هر فایل
                          حداکثر ۵ مگابایت
                        </span>
                        <input
                          className="sr-only"
                          type="file"
                          accept=".pdf,.docx"
                          multiple
                          disabled={remainingSlots === 0 || upload.isPending}
                          {...filesField}
                          onChange={handleFilesSelected}
                        />
                      </label>
                      {selectedCount > 0 && (
                        <div
                          className={`rounded-xl p-3 text-xs ${upload.error ? "bg-[#fff8ed] text-[#72502b]" : "bg-[#edf7f0] text-[#32634d]"}`}
                        >
                          <strong>
                            {upload.isPending
                              ? "در حال ورود فایل‌ها..."
                              : upload.error
                                ? "ورود فایل‌ها ناموفق بود"
                                : `${selectedCount.toLocaleString("fa-IR")} فایل انتخاب شده است`}
                          </strong>
                          <ul className="mb-0 mt-2 max-h-28 space-y-1 overflow-auto pr-4">
                            {Array.from(selectedFiles).map((file, index) => (
                              <li key={`${file.name}-${index}`} className="truncate" dir="auto">
                                {file.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedCount > remainingSlots && (
                        <p role="alert" className="m-0 text-xs text-red-600">
                          تعداد فایل‌های انتخابی از ظرفیت باقی‌مانده بیشتر است.
                        </p>
                      )}
                      {filesForm.formState.errors.files && (
                        <p role="alert" className="m-0 text-xs text-red-600">
                          {filesForm.formState.errors.files.message}
                        </p>
                      )}
                      {upload.error && <EmployerActionError error={upload.error} cost={0} />}
                      {selectedCount > 0 && !filesForm.formState.errors.files && (
                        <button
                          className="min-h-10 rounded-xl bg-[#0f7b62] px-4 text-sm font-bold text-white disabled:opacity-50"
                          type="submit"
                          disabled={upload.isPending || selectedCount > remainingSlots}
                        >
                          {upload.isPending
                            ? "در حال افزودن..."
                            : `افزودن ${selectedCount.toLocaleString("fa-IR")} رزومه`}
                        </button>
                      )}
                    </form>
                  )}
                </div>
              )}
              {(position.screeningStatus !== "not_started" || hasInvitations) && (
                <p className="rounded-xl bg-[#fff8ed] p-4 text-xs leading-6 text-[#816145]">
                  پایش یا دعوت این پوزیشن شروع شده است؛ رزومه‌ها را می‌توانی مرور کنی، اما افزودن یا حذف آن‌ها دیگر ممکن
                  نیست.
                </p>
              )}
              <div className="mt-4 space-y-2">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-[#edf0ed] py-3 text-sm"
                    dir="rtl"
                  >
                    <div className="min-w-0 text-right">
                      <strong className="block truncate">
                        <bdi>{candidate.fileName}</bdi>
                      </strong>
                      {candidate.name && candidate.name !== candidate.fileName && (
                        <span className="block truncate text-xs text-[#769084]">
                          <bdi>{candidate.name}</bdi>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="rounded-full bg-[#f1f6f2] px-2 py-1 text-xs text-[#607b6c]">
                        {position.screeningStatus === "not_started" ? "واردشده" : statusLabel(candidate)}
                      </span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#dce9df] px-2 py-1 text-xs text-[#0f7b62]"
                        onClick={() => setPreviewId(candidate.id)}
                      >
                        <Eye size={14} /> نمایش
                      </button>
                      {position.screeningStatus === "not_started" &&
                        !hasInvitations &&
                        candidate.invitationStatus === "not_invited" && (
                          <button
                            type="button"
                            aria-label={`حذف ${candidate.fileName}`}
                            className="rounded-lg border border-[#f0d5d0] p-2 text-[#ae5549]"
                            onClick={() => setDeleteId(candidate.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {visibleStep === 3 && (
            <section
              id="review-method"
              className="order-2 scroll-mt-24 rounded-[24px] border border-[#dce9e0] bg-white p-5 sm:p-7"
            >
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf6ef] text-[#0f7b62]">
                    <SearchCheck size={25} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="m-0 text-lg font-bold text-[#19312f]">روش بررسی رزومه‌ها</h2>
                    <p className="mb-0 mt-1 text-sm leading-7 text-[#6b8174]">
                      روش مناسب این پوزیشن را انتخاب کن؛ اگر پایش هوشمند ناموفق باشد، می‌توانی به بررسی دستی بروی.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#f2f7f3] px-3 py-1.5 text-xs font-bold text-[#557768]">
                  {candidates.length.toLocaleString("fa-IR")} رزومه برای بررسی
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  aria-pressed={selectedReviewMethod === "manual"}
                  disabled={reviewMethodLocked || chooseReview.isPending || selectedReviewMethod === "manual"}
                  onClick={() => selectReviewMethod("manual")}
                  className={`group rounded-2xl border p-5 text-right transition-colors enabled:hover:border-[#82bda0] enabled:hover:bg-[#f8fcf9] disabled:cursor-default ${selectedReviewMethod === "manual" ? "border-[#80bda0] bg-[#eef8f1]" : "border-[#dfe9e2] bg-[#fafcfb]"}`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-white text-[#0f7b62]">
                      <Eye size={22} aria-hidden="true" />
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0f7b62]">رایگان</span>
                  </span>
                  <strong className="mt-4 block text-base text-[#19312f]">بررسی دستی · رایگان</strong>
                  <span className="mt-1 block text-sm leading-7 text-[#637a6f]">
                    رزومه‌ها را خودت مرور کن و نامزدها را برای مصاحبه انتخاب کن.
                  </span>
                  <span className="mt-4 block border-t border-[#dfe9e2] pt-3 text-xs font-bold text-[#0f7b62]">
                    {selectedReviewMethod === "manual" ? "روش انتخاب‌شده" : "انتخاب بررسی دستی"}
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={selectedReviewMethod === "smart"}
                  disabled={reviewMethodLocked || chooseReview.isPending || selectedReviewMethod === "smart"}
                  onClick={() => selectReviewMethod("smart")}
                  className={`group rounded-2xl border p-5 text-right transition-colors enabled:hover:border-[#82bda0] enabled:hover:bg-[#f8fcf9] disabled:cursor-default ${selectedReviewMethod === "smart" ? "border-[#80bda0] bg-[#eef8f1]" : "border-[#dfe9e2] bg-[#fafcfb]"}`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-white text-[#0f7b62]">
                      <Sparkles size={22} aria-hidden="true" />
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0f7b62]">
                      {costs.screening.toLocaleString("fa-IR")} رادیکوین
                    </span>
                  </span>
                  <strong className="mt-4 block text-base text-[#19312f]">پایش هوشمند</strong>
                  <span className="mt-1 block text-sm leading-7 text-[#637a6f]">
                    رزومه‌ها بر اساس شرح پوزیشن رتبه‌بندی می‌شوند و شواهد انطباق نمایش داده می‌شود.
                  </span>
                  <span className="mt-4 block border-t border-[#dfe9e2] pt-3 text-xs font-bold text-[#0f7b62]">
                    {selectedReviewMethod === "smart" ? "روش انتخاب‌شده" : "انتخاب پایش هوشمند"}
                  </span>
                </button>
              </div>
              {reviewMethodLocked && (
                <p className="mb-0 mt-4 text-xs leading-6 text-[#6b8174]">
                  هنگام پایش یا پس از تکمیل آن، تغییر روش بررسی ممکن نیست.
                </p>
              )}
              {position.screeningStatus === "completed" && (
                <p className="mb-0 mt-4 rounded-xl bg-[#edf8f1] p-4 text-sm leading-7 text-[#315848]">
                  پایش هوشمند کامل شده و نتایج در مرحلهٔ انتخاب و دعوت آماده‌اند.
                </p>
              )}
              {chooseReview.error && (
                <div className="mt-4">
                  <EmployerActionError error={chooseReview.error} cost={0} />
                </div>
              )}
              {position.screeningStatus === "processing" && (
                <p className="mb-0 mt-4 rounded-xl bg-[#f2faf5] px-4 py-3 text-sm text-[#315848]">
                  پردازش‌شده: {(progress?.processed ?? processed).toLocaleString("fa-IR")} از{" "}
                  {(progress?.total ?? candidates.length).toLocaleString("fa-IR")}
                </p>
              )}
              {screeningFailure && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-3 rounded-xl border border-[#ecd6b6] bg-[#fffbf3] p-4 text-right text-[#72502b]"
                >
                  <CircleAlert className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <strong className="block text-sm">
                      {screenInsufficient ? "رادیکوین کافی نداری" : "پایش کامل نشد"}
                    </strong>
                    <p className="mb-0 mt-1 text-xs leading-6">{screeningFailure}</p>
                    {screenInsufficient && (
                      <Link
                        href="/radicoins"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#755022]"
                      >
                        مشاهدهٔ کیف پول <ArrowLeft size={14} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
              {position.screeningStatus !== "completed" &&
                (position.reviewMethod === "smart" || position.screeningStatus === "processing") && (
                  <div className="mt-5 flex flex-col gap-3 border-t border-[#e4ece6] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="mb-0 text-xs leading-6 text-[#637a6f]">هزینه فقط پس از شروع پایش رزرو می‌شود.</p>
                    <button
                      disabled={screen.isPending || !candidates.length}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold disabled:opacity-50 ${screenInsufficient ? "border border-[#d5b889] bg-white text-[#755022]" : "bg-[#0f7b62] text-white"}`}
                      type="button"
                      onClick={startScreening}
                    >
                      {screen.isPending ? <LoaderCircle className="animate-spin" size={17} /> : <Sparkles size={17} />}
                      {position.screeningStatus === "processing"
                        ? "ادامهٔ پایش"
                        : screenInsufficient
                          ? "پس از تأمین اعتبار، تلاش دوباره"
                          : position.screeningStatus === "failed" || screeningFailure
                            ? "تلاش دوباره برای پایش"
                            : `شروع پایش و رزرو ${costs.screening.toLocaleString("fa-IR")} رادیکوین`}
                    </button>
                  </div>
                )}
            </section>
          )}
          {visibleStep === 4 && candidates.length > 0 && (
            <section
              id="candidates"
              className="order-3 scroll-mt-24 rounded-[20px] border border-[#dfe9e3] bg-white p-5"
            >
              <h2 className="mb-1 mt-0 text-lg font-bold">
                {position.screeningStatus === "completed" ? "فهرست نامزدهای مناسب" : "انتخاب دستی برای مصاحبه"}
              </h2>
              <p className="mb-5 text-xs leading-6 text-[#71877a]">
                {position.screeningStatus === "completed"
                  ? "امتیاز، تصمیم استخدام نیست. شواهد و موارد نامشخص را قبل از دعوت بررسی کن."
                  : "می‌توانی بدون پرداخت هزینهٔ پایش، رزومه‌ها را خودت بررسی و نامزدهای مصاحبه را انتخاب کنی. در این حالت رتبه‌بندی یا پیشنهاد مدل وجود ندارد."}
              </p>
              {!selectableCandidates.length && (
                <p className="text-sm text-[#7e8f84]">رزومهٔ قابل ارزیابی در این نوبت پیدا نشد.</p>
              )}
              <div className="grid gap-4">
              {selectableCandidates.map((candidate) => {
                const invitation = invitationPresentation(candidate.invitationStatus);
                return (
                <article
                  key={candidate.id}
                  className="group relative overflow-hidden rounded-[18px] border border-[#dce9e1] bg-gradient-to-bl from-white via-white to-[#f4faf6] p-4 shadow-[0_8px_26px_rgba(28,63,52,.055)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#b8d8c8] hover:shadow-[0_14px_34px_rgba(28,63,52,.09)] sm:p-5"
                >
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#0f7b62] via-[#67b694] to-[#d9eee4]" />
                  <div className="flex flex-wrap items-start gap-3 border-b border-[#e7eee9] pb-4">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <Checkbox
                        aria-label={`انتخاب ${candidateLabel(candidate)}`}
                        disabled={candidate.invitationStatus !== "not_invited" || !candidate.phone}
                        checked={selected.includes(candidate.id)}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked
                              ? [...current, candidate.id]
                              : current.filter((value) => value !== candidate.id),
                          )
                        }
                      />
                      <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-[#e8f4ed] text-[#0f7b62] ring-1 ring-[#d7e9df]">
                        <UserRound size={20} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-bold text-[#19312f]">{candidateLabel(candidate)}</strong>
                      </span>
                    </label>
                    <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-[10px] font-bold ${invitation.tone}`}>
                      {invitation.label}
                    </span>
                    {candidate.matchEvidence && (
                      <span className="inline-flex min-h-8 items-center rounded-full border border-[#cfe6da] bg-white px-3 text-[10px] font-bold text-[#0f7b62]">
                        {candidate.matchEvidence.score.toLocaleString("fa-IR")} از ۱۰۰
                      </span>
                    )}
                  </div>
                  <div className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                    <div className="min-w-0">
                      {candidate.matchEvidence?.summary && (
                        <p className="m-0 text-xs leading-7 text-[#486459]">{candidate.matchEvidence.summary}</p>
                      )}
                      <div className="mt-2 grid gap-1.5 text-[11px] leading-6">
                        {candidate.matchEvidence?.matched.length ? (
                          <p className="m-0 text-[#0f7b62]">شواهد انطباق: {candidate.matchEvidence.matched.join("، ")}</p>
                        ) : null}
                        {candidate.matchEvidence?.missing.length ? (
                          <p className="m-0 text-[#a35c3b]">مغایرت: {candidate.matchEvidence.missing.join("، ")}</p>
                        ) : null}
                        {candidate.matchEvidence?.unknown.length ? (
                          <p className="m-0 text-[#74877e]">نامشخص: {candidate.matchEvidence.unknown.join("، ")}</p>
                        ) : null}
                      </div>
                    </div>
                  {candidate.phone ? (
                    <div className="inline-flex min-h-9 items-center gap-2 self-start rounded-xl bg-[#f1f6f3] py-1 pl-1 pr-3 text-[11px] text-[#486459]">
                      <Phone size={14} className="text-[#0f7b62]" aria-hidden="true" />
                      <span dir="ltr">{candidate.phone}</span>
                      <button
                        type="button"
                        aria-label={`ویرایش شماره همراه ${candidateLabel(candidate)}`}
                        title="ویرایش شماره همراه"
                        className="grid size-7 place-items-center rounded-lg border border-[#d5e5dc] bg-white text-[#0f7b62] transition-colors hover:border-[#a9cfbc] hover:bg-[#e8f4ed]"
                        onClick={() => {
                          mobileForm.reset({ phone: candidate.phone ?? "" });
                          saveCandidatePhone.reset();
                          setPhoneCandidateId(candidate.id);
                        }}
                      >
                        <Pencil size={13} aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex max-w-sm flex-wrap items-center gap-2 rounded-xl border border-[#f0d9ae] bg-[#fffaf0] p-3">
                      <p className="m-0 text-[11px] leading-6 text-amber-700">
                        شماره همراه این نامزد ثبت نشده است؛ پیش از انتخاب و ساخت دعوت، شماره را اضافه کن.
                      </p>
                      <button
                        type="button"
                        className="rounded-lg border border-[#cfe4d5] bg-white px-3 py-2 text-xs font-bold text-[#0f7b62] hover:bg-[#edf7f0]"
                        onClick={() => {
                          mobileForm.reset();
                          saveCandidatePhone.reset();
                          setPhoneCandidateId(candidate.id);
                        }}
                      >
                        افزودن شماره همراه
                      </button>
                    </div>
                  )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#e7eee9] pt-3">
                    <button
                      type="button"
                      aria-label={`پیش‌نمایش رزومه ${candidate.fileName}`}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#d6e6dc] bg-white px-3.5 text-xs font-bold text-[#0f7b62] transition-colors hover:bg-[#edf7f0]"
                      onClick={() => setPreviewId(candidate.id)}
                    >
                      <Eye size={15} aria-hidden="true" /> پیش‌نمایش رزومه
                    </button>
                  {["invited", "accepted", "started"].includes(candidate.invitationStatus) && (
                    <button
                      type="button"
                      disabled={renewLink.isPending}
                      onClick={() => renewLink.mutate({ candidateId: candidate.id })}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#cfe4d5] bg-white px-3.5 text-xs font-bold text-[#0f7b62] hover:bg-[#edf7f0] disabled:opacity-50"
                    >
                      <Send size={15} aria-hidden="true" /> ارسال مجدد لینک دعوت
                    </button>
                  )}
                  {["expired", "completed"].includes(candidate.invitationStatus) && candidate.phone && (
                    <button
                      type="button"
                      disabled={renewLink.isPending}
                      onClick={() => {
                        renewLink.reset();
                        resendForm.reset({ deadlineDate: "", deadlineTime: "23:59" });
                        setResendCandidateId(candidate.id);
                      }}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0f7b62] px-4 text-xs font-bold text-white shadow-[0_7px_18px_rgba(15,123,98,.18)] transition-colors hover:bg-[#0b6d58] disabled:opacity-50"
                    >
                      <Send size={15} aria-hidden="true" /> {candidate.invitationStatus === "completed" ? "دعوت برای ارزیابی دوباره" : "ارسال مجدد لینک دعوت"}
                    </button>
                  )}
                  </div>
                  {renewLink.error && renewLink.variables?.candidateId === candidate.id && !resendCandidateId && (
                    <EmployerActionError error={renewLink.error} cost={0} />
                  )}
                  {candidate.interviewReport && (
                    <section className="border-t border-[#e7eee9] pt-3">
                      <button
                        type="button"
                        aria-controls={`interview-report-${candidate.id}`}
                        aria-expanded={expandedReportId === candidate.id}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#cfe4d5] bg-white px-3.5 text-xs font-bold text-[#0f7b62] transition-colors hover:bg-[#edf7f0]"
                        onClick={() => setExpandedReportId((current) => (current === candidate.id ? null : candidate.id))}
                      >
                        نمایش نتیجه
                        <ChevronDown
                          size={16}
                          aria-hidden="true"
                          className={`transition-transform duration-300 ${expandedReportId === candidate.id ? "rotate-180" : ""}`}
                        />
                      </button>
                      <div
                        id={`interview-report-${candidate.id}`}
                        role="region"
                        aria-label={`نتیجهٔ مصاحبه ${candidateLabel(candidate)}`}
                        aria-hidden={expandedReportId !== candidate.id}
                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${expandedReportId === candidate.id ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <InterviewReportView
                            report={candidate.interviewReport}
                            questions={candidate.conversationQuestions ?? []}
                            variant="employer"
                            showHero={false}
                          />
                        </div>
                      </div>
                    </section>
                  )}
                </article>
                );
              })}
              </div>
            </section>
          )}
        </div>
        <div className="contents">
          {visibleStep === 4 && candidates.length > 0 && (
            <section id="invite" className="order-4 scroll-mt-24 rounded-[20px] border border-[#dfe9e3] bg-white p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <Send className="shrink-0 text-[#0f7b62]" size={24} aria-hidden="true" />
                <div>
                  <h2 className="m-0 text-base font-bold">دعوت به مصاحبه</h2>
                </div>
              </div>
              <p className="text-xs leading-7 text-[#6b8174]">
                {position.screeningStatus === "completed"
                  ? "مدل می‌تواند ۴ نفر اول را پیشنهاد کند؛ فقط نامزدهای دارای شماره همراه معتبر قابل دعوت‌اند."
                  : "نامزدهای دارای شماره همراه معتبر را انتخاب کن و برایشان لینک اختصاصی مصاحبه بساز."}
              </p>
              {position.screeningStatus === "completed" && (
                <button
                  className="mb-4 min-h-9 rounded-lg border border-[#b9d8c5] px-3 text-xs font-bold text-[#0f7b62]"
                  type="button"
                  onClick={() =>
                    setSelected(
                      screenedCandidates
                        .filter((candidate) => candidate.invitationStatus === "not_invited" && candidate.phone)
                        .slice(0, 4)
                        .map((candidate) => candidate.id),
                    )
                  }
                >
                  انتخاب ۴ نامزد پیشنهادی
                </button>
              )}
              {selected.length === 0 && (
                <p className="rounded-xl bg-[#f3f8f4] p-4 text-xs text-[#60766a]">
                  ابتدا نامزدها را از فهرست بالا انتخاب کن؛ سپس مهلت مصاحبه را تعیین می‌کنی.
                </p>
              )}
              {selected.length > 0 && (
                <form className="space-y-3" onSubmit={inviteForm.handleSubmit((values) => invite.mutate(values))}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="mb-2 block text-xs font-bold text-[#456354]">تاریخ مهلت شرکت در مصاحبه</span>
                      <Controller
                        control={inviteForm.control}
                        name="deadlineDate"
                        render={({ field }) => (
                          <JalaliDatePicker
                            ariaLabel="تاریخ مهلت شرکت در مصاحبه"
                            value={field.value}
                            onChange={field.onChange}
                            invalid={Boolean(inviteForm.formState.errors.deadlineDate)}
                          />
                        )}
                      />
                      {inviteForm.formState.errors.deadlineDate && (
                        <p role="alert" className="mt-1 text-xs text-red-600">
                          {inviteForm.formState.errors.deadlineDate.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="mb-2 block text-xs font-bold text-[#456354]">ساعت مهلت (به وقت تهران)</span>
                      <Controller
                        control={inviteForm.control}
                        name="deadlineTime"
                        render={({ field }) => (
                          <TimePicker
                            ariaLabel="ساعت مهلت (به وقت تهران)"
                            value={field.value}
                            onChange={field.onChange}
                            invalid={Boolean(inviteForm.formState.errors.deadlineTime)}
                          />
                        )}
                      />
                      {inviteForm.formState.errors.deadlineTime && (
                        <span role="alert" className="mt-1 block text-xs text-red-600">
                          {inviteForm.formState.errors.deadlineTime.message}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="m-0 text-xs leading-6 text-[#6b8174]">
                    {selected.length.toLocaleString("fa-IR")} نفر انتخاب شده · حداکثر رزرو{" "}
                    {(selected.length * costs.interview).toLocaleString("fa-IR")} رادیکوین؛ فقط مصاحبهٔ تکمیل‌شده هزینه
                    دارد.
                  </p>
                  {invite.error && (
                    <EmployerActionError
                      error={invite.error}
                      balance={wallet.data?.wallet?.availableCoins}
                      cost={selected.length * costs.interview}
                    />
                  )}
                  <button
                    disabled={invite.isPending || !selected.length}
                    className="min-h-11 w-full rounded-xl bg-[#0f7b62] px-4 text-sm font-bold text-white disabled:opacity-50"
                    type="submit"
                  >
                    {invite.isPending ? "در حال ساخت دعوت‌ها..." : "تأیید و ساخت لینک دعوت"}
                  </button>
                </form>
              )}
              {links.length > 0 && (
                <div className="mt-5 space-y-3 border-t border-[#e1ebe4] pt-4">
                  <strong className="text-sm">لینک‌های دعوت آماده‌اند</strong>
                  <p className="text-xs leading-6 text-[#71877a]">
                    اعضای رادیکار اعلان داخل پنل دریافت می‌کنند؛ برای سایر نامزدها پیامک لینک دعوت ارسال می‌شود.
                  </p>
                  {links.map((link) => (
                    <div key={link.candidateId} className="rounded-lg border border-[#dbe8df] p-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-bold text-[#19312f]">{link.name || "نامزد"}</span>
                        <button
                          className="inline-flex shrink-0 items-center gap-1 text-[#0f7b62]"
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(link.url);
                            setCopied(link.candidateId);
                          }}
                        >
                          <ClipboardCopy size={14} />
                          {copied === link.candidateId ? "کپی شد" : "کپی لینک"}
                        </button>
                      </div>
                      <p
                        className={`mb-0 mt-1 text-[11px] ${link.delivery === "sms_failed" || link.delivery === "sms_unavailable" ? "text-amber-700" : "text-[#0f7b62]"}`}
                      >
                        {link.delivery === "in_app"
                          ? "دعوت در پنل کارجو ثبت شد و اعلان دریافت می‌کند."
                          : link.delivery === "sms_sent"
                            ? "پیامک دعوت برای نامزد ارسال شد."
                            : link.delivery === "sms_failed"
                              ? "ارسال پیامک ناموفق بود؛ لینک را دستی برای نامزد بفرست."
                              : "ارسال پیامک پیکربندی نشده است؛ لینک را دستی برای نامزد بفرست."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
      <nav aria-label="جابجایی بین مراحل جذب" className="px-1 pb-2 sm:px-2">
        {visibleStep === 2 && continueFlow.error && (
          <div className="mb-4">
            <EmployerActionError error={continueFlow.error} cost={0} />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#cfe3d8] px-5 text-sm font-bold text-[#0f7b62] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={visibleStep === 1}
            onClick={() => navigateStep((visibleStep - 1) as 1 | 2 | 3)}
          >
            <ArrowRight size={17} /> مرحلهٔ قبل
          </button>
          {visibleStep < 4 && (
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0f7b62] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                continueFlow.isPending ||
                (visibleStep === 2 && (selectedCount > 0 || (availableStep === 2 && !candidates.length))) ||
                (visibleStep === 3 && availableStep === 3)
              }
              onClick={goForward}
            >
              {continueFlow.isPending ? "در حال آماده‌سازی..." : "مرحلهٔ بعد"} <ArrowLeft size={17} />
            </button>
          )}
        </div>
        {visibleStep === 2 && selectedCount > 0 && (
          <p className="mb-0 mt-3 text-xs text-[#6b8174]">
            ابتدا فایل‌های انتخاب‌شده را اضافه کن تا بتوانی ادامه بدهی.
          </p>
        )}
        {visibleStep === 2 && !candidates.length && selectedCount === 0 && (
          <p className="mb-0 mt-3 text-xs text-[#6b8174]">برای رفتن به مرحلهٔ بعد، دست‌کم یک رزومه اضافه کن.</p>
        )}
        {visibleStep === 3 && availableStep === 3 && (
          <p className="mb-0 mt-3 text-xs text-[#6b8174]">
            {position.reviewMethod === "smart" || position.screeningStatus === "processing"
              ? "پس از پایان پایش هوشمند، مرحلهٔ انتخاب و دعوت باز می‌شود."
              : "برای ادامه، روش بررسی دستی یا پایش هوشمند را انتخاب کن."}
          </p>
        )}
      </nav>
      {bankPickerOpen && (
        <Modal title="انتخاب از بانک رزومه" onClose={() => setBankPickerOpen(false)} showCloseButton wide>
          <div className="mt-5">
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#dfe9e3] px-3 text-[#71877a]">
              <Search size={17} aria-hidden="true" />
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[#19312f] outline-none"
                aria-label="جست‌وجو در بانک رزومه"
                placeholder="نام، تخصص یا نام فایل را جست‌وجو کن"
                value={bankSearch}
                onChange={(event) => setBankSearch(event.target.value)}
              />
            </label>
            <p className="mt-3 text-xs text-[#6b8174]">
              {bankSelected.length.toLocaleString("fa-IR")} انتخاب‌شده · حداکثر {remainingSlots.toLocaleString("fa-IR")}{" "}
              رزومهٔ دیگر
            </p>
            <div className="max-h-[50vh] space-y-2 overflow-auto">
              {resumeBank.isLoading && <p className="text-xs text-[#71877a]">در حال دریافت بانک رزومه...</p>}
              {resumeBank.error && <EmployerActionError error={resumeBank.error} cost={0} />}
              {!resumeBank.isLoading && !resumeBank.error && bankMatches.length === 0 && (
                <p className="rounded-xl bg-[#f7faf7] p-4 text-xs text-[#71877a]">
                  رزومه‌ای پیدا نشد. می‌توانی از دستگاه فایل تازه‌ای اضافه کنی یا به بانک رزومه بروی.
                </p>
              )}
              {bankMatches.map((resume) => (
                <label
                  key={resume.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e5ede8] bg-white px-4 py-3 text-xs text-[#40594f]"
                >
                  <Checkbox
                    aria-label={`انتخاب ${resume.name || resume.fileName}`}
                    checked={bankSelected.includes(resume.id)}
                    disabled={!bankSelected.includes(resume.id) && bankSelected.length >= remainingSlots}
                    onChange={(event) =>
                      setBankSelected((current) =>
                        event.target.checked ? [...current, resume.id] : current.filter((item) => item !== resume.id),
                      )
                    }
                  />
                  <span className="min-w-0 flex-1 truncate font-bold">{resume.name || resume.fileName}</span>
                  {resume.specialty && <span className="max-w-48 truncate text-[#71877a]">{resume.specialty}</span>}
                </label>
              ))}
            </div>
            {importFromBank.error && <EmployerActionError error={importFromBank.error} cost={0} />}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf1ec] pt-4">
              <Link className="text-xs font-bold text-[#0f7b62]" href="/employer/resume-bank">
                مدیریت بانک رزومه
              </Link>
              <button
                className="min-h-10 rounded-xl bg-[#0f7b62] px-5 text-sm font-bold text-white disabled:opacity-50"
                type="button"
                disabled={!bankSelected.length || bankSelected.length > remainingSlots || importFromBank.isPending}
                onClick={() => importFromBank.mutate()}
              >
                {importFromBank.isPending
                  ? "در حال افزودن..."
                  : `افزودن ${bankSelected.length.toLocaleString("fa-IR")} رزومه`}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {previewId && candidates.find((candidate) => candidate.id === previewId) && (
        <EmployerResumePreview
          positionId={id}
          candidate={candidates.find((candidate) => candidate.id === previewId)!}
          onClose={() => setPreviewId(null)}
        />
      )}
      {phoneCandidateId && (
        <Modal
          title={phoneCandidate?.phone ? "ویرایش شماره همراه" : "افزودن شماره همراه"}
          onClose={() => setPhoneCandidateId(null)}
          showCloseButton
        >
          <form
            className="mt-5 space-y-4"
            onSubmit={mobileForm.handleSubmit(({ phone }) =>
              saveCandidatePhone.mutate({ candidateId: phoneCandidateId, phone }),
            )}
          >
            <label htmlFor="candidate-mobile" className="block text-xs font-bold text-[#456354]">
              شماره همراه نامزد
            </label>
            <input
              id="candidate-mobile"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder="09123456789"
              aria-invalid={Boolean(mobileForm.formState.errors.phone)}
              className="block min-h-11 w-full rounded-xl border border-[#dfe9e3] px-3 text-sm text-[#19312f] outline-none focus:border-[#0f7b62]"
              {...mobileForm.register("phone")}
            />
            {mobileForm.formState.errors.phone && (
              <p role="alert" className="m-0 text-xs text-red-600">
                {mobileForm.formState.errors.phone.message}
              </p>
            )}
            {saveCandidatePhone.error && <EmployerActionError error={saveCandidatePhone.error} cost={0} />}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="min-h-10 rounded-xl border border-[#dfe9e3] px-4 text-xs text-[#526461]"
                onClick={() => setPhoneCandidateId(null)}
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={saveCandidatePhone.isPending}
                className="min-h-10 rounded-xl bg-[#0f7b62] px-5 text-xs font-bold text-white disabled:opacity-50"
              >
                {saveCandidatePhone.isPending
                  ? "در حال ذخیره..."
                  : phoneCandidate?.phone
                    ? "ذخیره تغییرات"
                    : "ذخیره شماره همراه"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {resendCandidateId && (
        <Modal
          title="ارسال مجدد دعوت مصاحبه"
          description={candidates.some((candidate) => candidate.id === resendCandidateId && candidate.invitationStatus === "completed")
            ? "با ارسال این دعوت، پاسخ‌ها و گزارش قبلی پاک می‌شوند و کارجو مصاحبه را از ابتدا شروع می‌کند."
            : undefined}
          onClose={() => {
            setResendCandidateId(null);
            renewLink.reset();
          }}
          showCloseButton
        >
          <form
            className="mt-5 space-y-4"
            onSubmit={resendForm.handleSubmit(({ deadlineDate, deadlineTime }) =>
              renewLink.mutate({
                candidateId: resendCandidateId,
                deadline: new Date(`${deadlineDate}T${deadlineTime}:00+03:30`).toISOString(),
              }),
            )}
          >
            <p className="m-0 text-xs leading-6 text-[#61766c]">
              لینک قبلی باطل می‌شود و دعوت با مهلت تازه دوباره برای نامزد ارسال خواهد شد.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="mb-2 block text-xs font-bold text-[#456354]">تاریخ مهلت تازه</span>
                <Controller
                  control={resendForm.control}
                  name="deadlineDate"
                  render={({ field }) => (
                    <JalaliDatePicker
                      ariaLabel="تاریخ مهلت تازه"
                      value={field.value}
                      onChange={field.onChange}
                      invalid={Boolean(resendForm.formState.errors.deadlineDate)}
                    />
                  )}
                />
                {resendForm.formState.errors.deadlineDate && (
                  <p role="alert" className="mb-0 mt-1 text-xs text-red-600">
                    {resendForm.formState.errors.deadlineDate.message}
                  </p>
                )}
              </div>
              <div>
                <span className="mb-2 block text-xs font-bold text-[#456354]">ساعت مهلت (به وقت تهران)</span>
                <Controller
                  control={resendForm.control}
                  name="deadlineTime"
                  render={({ field }) => (
                    <TimePicker
                      ariaLabel="ساعت مهلت تازه (به وقت تهران)"
                      value={field.value}
                      onChange={field.onChange}
                      invalid={Boolean(resendForm.formState.errors.deadlineTime)}
                    />
                  )}
                />
                {resendForm.formState.errors.deadlineTime && (
                  <p role="alert" className="mb-0 mt-1 text-xs text-red-600">
                    {resendForm.formState.errors.deadlineTime.message}
                  </p>
                )}
              </div>
            </div>
            <p className="m-0 text-xs leading-6 text-[#6b8174]">
              {costs.interview.toLocaleString("fa-IR")} رادیکوین دوباره رزرو می‌شود و فقط در صورت تکمیل مصاحبه مصرف
              خواهد شد.
            </p>
            {renewLink.error && (
              <EmployerActionError
                error={renewLink.error}
                balance={wallet.data?.wallet?.availableCoins}
                cost={costs.interview}
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="min-h-10 rounded-xl border border-[#dfe9e3] px-4 text-xs text-[#526461]"
                onClick={() => setResendCandidateId(null)}
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={renewLink.isPending}
                className="min-h-10 rounded-xl bg-[#0f7b62] px-5 text-xs font-bold text-white disabled:opacity-50"
              >
                {renewLink.isPending ? "در حال ارسال مجدد..." : "تأیید و ارسال مجدد"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleteId && (
        <DeleteConfirmModal
          itemName={candidates.find((candidate) => candidate.id === deleteId)?.fileName ?? "رزومه"}
          description="این رزومه از پوزیشن حذف می‌شود و در پایش بعدی شرکت نمی‌کند. این کار قابل بازگشت نیست."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => removeResume.mutate(deleteId)}
        />
      )}
      {removeResume.error && <EmployerActionError error={removeResume.error} cost={0} />}
    </div>
  );
}
