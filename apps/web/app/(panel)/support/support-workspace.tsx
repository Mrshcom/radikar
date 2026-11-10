"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, CircleHelp, MessageSquareText, Plus, Send } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/app/_components/auth";
import { useToast } from "@/app/_components/toast";
import { apiRequest } from "@/lib/api-client";
import { SectionTitle } from "@/app/(panel)/_components/ui";
import { FormField } from "@/app/(panel)/_components/form-field";
import { TableFilterSelect } from "@/app/(panel)/_components/table-controls";
import { SearchableSelect } from "@/app/_components/searchable-select";
import { TextAreaField, TextField } from "@/app/_components/text-field";

type Status = "open" | "answered" | "closed";
type AccountType = "candidate" | "employer";
type Ticket = {
  id: string;
  subject: string;
  category: "technical" | "account" | "payment" | "other";
  status: Status;
  accountType: AccountType;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  createdAt: string;
  updatedAt: string;
};
type Message = { id: string; body: string; authorRole: "user" | "support"; createdAt: string };
type Detail = Ticket & { messages: Message[] };

const createSchema = z.object({
  subject: z.string().trim().min(5, "موضوع باید حداقل ۵ نویسه باشد.").max(160),
  category: z.enum(["technical", "account", "payment", "other"]),
  message: z.string().trim().min(10, "شرح درخواست باید حداقل ۱۰ نویسه باشد.").max(10000),
});
const replySchema = z.object({ message: z.string().trim().min(2, "پیام را بنویس.").max(10000) });
type CreateInput = z.infer<typeof createSchema>;
type ReplyInput = z.infer<typeof replySchema>;

const statusText: Record<Status, string> = { open: "در انتظار پاسخ", answered: "پاسخ داده‌شده", closed: "بسته‌شده" };
const statusStyle: Record<Status, string> = {
  open: "bg-amber-50 text-amber-800",
  answered: "bg-emerald-50 text-emerald-800",
  closed: "bg-slate-100 text-slate-600",
};
const categoryText = { technical: "فنی", account: "حساب کاربری", payment: "پرداخت", other: "سایر" };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function SupportWorkspace({ mode }: { mode: "candidate" | "employer" | "admin" }) {
  const { user } = useAuth();
  const notify = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [accountType, setAccountType] = useState("all");
  const admin = mode === "admin";
  const allowed = admin ? user?.role === "superadmin" : user?.role === "user" && user.accountType === mode;
  const endpoint = admin ? "/api/admin/support/tickets" : "/api/support/tickets";
  const listKey = ["support-tickets", mode, page, status, accountType];
  const list = useQuery({
    queryKey: listKey,
    queryFn: () => apiRequest<{ tickets: Ticket[]; total?: number; pageSize?: number }>(
      admin ? `${endpoint}?page=${page}&status=${status}&accountType=${accountType}` : endpoint,
    ),
    enabled: allowed,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
  const detail = useQuery({
    queryKey: ["support-ticket", mode, selectedId],
    queryFn: () => apiRequest<{ ticket: Detail }>(`${endpoint}/${selectedId}`),
    enabled: allowed && !!selectedId,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
  const createForm = useForm<CreateInput>({ resolver: zodResolver(createSchema), defaultValues: { subject: "", category: "technical", message: "" } });
  const replyForm = useForm<ReplyInput>({ resolver: zodResolver(replySchema), defaultValues: { message: "" } });
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    if (selectedId) await queryClient.invalidateQueries({ queryKey: ["support-ticket", mode, selectedId] });
  };
  const create = useMutation({
    mutationFn: (input: CreateInput) => apiRequest<{ ticket: Detail }>(endpoint, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: async ({ ticket }) => {
      createForm.reset(); setCreating(false); setSelectedId(ticket.id); await refresh(); notify("تیکت با موفقیت ثبت شد.");
    },
    onError: (error: Error) => notify(error.message, "error"),
  });
  const reply = useMutation({
    mutationFn: (input: ReplyInput) => apiRequest<{ ticket: Detail }>(`${endpoint}/${selectedId}/messages`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: async () => { replyForm.reset(); await refresh(); notify("پیام ارسال شد."); },
    onError: (error: Error) => notify(error.message, "error"),
  });
  const changeStatus = useMutation({
    mutationFn: (next: "open" | "closed") => apiRequest(`${endpoint}/${selectedId}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) }),
    onSuccess: async () => { await refresh(); notify("وضعیت تیکت به‌روزرسانی شد."); },
    onError: (error: Error) => notify(error.message, "error"),
  });

  if (!allowed) return <p className="rounded-2xl bg-white p-6 text-sm text-[#536762]">دسترسی به پشتیبانی این پنل برای حساب شما فعال نیست.</p>;

  return (
    <main className="mx-auto max-w-6xl pb-14" dir="rtl">
      <SectionTitle title={admin ? "پشتیبانی کاربران" : "پشتیبانی"}
        description={admin ? "درخواست‌های کارجویان و کارفرمایان را بررسی و پاسخ بده." : "درخواستت را ثبت کن و پاسخ تیم پشتیبانی را همین‌جا ببین."}
        action={!admin && <button type="button" onClick={() => { setSelectedId(null); setCreating(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0f7b62] px-5 py-3 text-sm font-bold text-white hover:bg-[#0b6652]"><Plus size={18} /> تیکت جدید</button>} />
      {admin && <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-[#dce9e1] bg-white p-4">
        <div className="min-w-44 flex-1 sm:max-w-56"><TableFilterSelect label="وضعیت" value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[
          { value: "all", label: "همه وضعیت‌ها" }, { value: "open", label: "در انتظار پاسخ" },
          { value: "answered", label: "پاسخ داده‌شده" }, { value: "closed", label: "بسته‌شده" },
        ]} /></div>
        <div className="min-w-44 flex-1 sm:max-w-56"><TableFilterSelect label="نوع حساب" value={accountType} onChange={(value) => { setAccountType(value); setPage(1); }} options={[
          { value: "all", label: "همه کاربران" }, { value: "candidate", label: "کارجو" },
          { value: "employer", label: "کارفرما" },
        ]} /></div>
      </div>}
      <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.45fr)]">
        <section className="overflow-hidden rounded-[22px] border border-[#dce9e1] bg-white">
          <div className="border-b border-[#e9efea] px-5 py-4"><h2 className="m-0 text-base font-black text-[#19312f]">فهرست تیکت‌ها</h2></div>
          {list.isPending ? <p className="p-6 text-sm text-[#71857c]">در حال دریافت تیکت‌ها…</p>
            : list.isError ? <p className="p-6 text-sm text-red-700">{list.error.message}</p>
            : list.data.tickets.length === 0 ? <div className="grid justify-items-center gap-2 p-10 text-center text-[#71857c]"><CircleHelp size={28} /><p className="m-0 text-sm">هنوز تیکتی در این فهرست نیست.</p></div>
            : <div className="divide-y divide-[#edf2ee]">{list.data.tickets.map((ticket) => <button key={ticket.id} type="button" onClick={() => { setSelectedId(ticket.id); setCreating(false); }}
              className={`w-full px-5 py-4 text-right transition hover:bg-[#f4faf6] ${selectedId === ticket.id ? "bg-[#edf7f1]" : ""}`}>
              <span className="flex items-start justify-between gap-2"><strong className="text-sm text-[#19312f]">{ticket.subject}</strong><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle[ticket.status]}`}>{statusText[ticket.status]}</span></span>
              {admin && <span className="mt-1 block text-xs text-[#536762]">{ticket.ownerName || ticket.ownerEmail || ticket.ownerPhone || "کاربر"} · {ticket.accountType === "employer" ? "کارفرما" : "کارجو"}</span>}
              <span className="mt-2 block text-[11px] text-[#86968d]">{categoryText[ticket.category]} · {dateLabel(ticket.updatedAt)}</span>
            </button>)}</div>}
          {admin && (list.data?.total ?? 0) > 30 && <div className="flex items-center justify-between border-t border-[#e9efea] px-5 py-3 text-xs">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-[#0f7b62] disabled:opacity-40">صفحه قبل</button>
            <span>{page} از {Math.ceil((list.data?.total ?? 0) / 30)}</span>
            <button type="button" disabled={page * 30 >= (list.data?.total ?? 0)} onClick={() => setPage(page + 1)} className="text-[#0f7b62] disabled:opacity-40">صفحه بعد</button>
          </div>}
        </section>

        <section className="min-h-80 rounded-[22px] border border-[#dce9e1] bg-white p-5 sm:p-7">
          {creating && !admin ? <form className="grid gap-5" onSubmit={createForm.handleSubmit((input) => create.mutate(input))}>
            <h2 className="m-0 text-lg font-black text-[#19312f]">ثبت تیکت جدید</h2>
            <FormField label="موضوع درخواست" htmlFor="support-subject" required error={createForm.formState.errors.subject?.message}>
              <TextField id="support-subject" aria-invalid={Boolean(createForm.formState.errors.subject)} {...createForm.register("subject")} placeholder="مثلاً مشکل در پرداخت" />
            </FormField>
            <FormField label="دسته‌بندی" required error={createForm.formState.errors.category?.message}>
              <Controller control={createForm.control} name="category" render={({ field }) => <SearchableSelect
                ariaLabel="دسته‌بندی تیکت" invalid={Boolean(createForm.formState.errors.category)} value={field.value}
                onChange={(value) => field.onChange(String(value))} options={[
                  { value: "technical", label: "مشکل فنی" }, { value: "account", label: "حساب کاربری" },
                  { value: "payment", label: "پرداخت" }, { value: "other", label: "سایر" },
                ]} />}/>
            </FormField>
            <FormField label="شرح درخواست" htmlFor="support-message" required error={createForm.formState.errors.message?.message}>
              <TextAreaField id="support-message" aria-invalid={Boolean(createForm.formState.errors.message)} className="min-h-40" {...createForm.register("message")} placeholder="مشکل یا پرسشت را با جزئیات بنویس…" />
            </FormField>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setCreating(false)} className="px-4 text-sm text-[#536762]">انصراف</button>
              <button type="submit" disabled={create.isPending} className="rounded-xl bg-[#0f7b62] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">ثبت تیکت</button>
            </div>
          </form> : selectedId ? detail.isPending ? <p className="text-sm text-[#71857c]">در حال دریافت گفتگو…</p> : detail.isError ? <p className="text-sm text-red-700">{detail.error.message}</p> : detail.data && <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e9efea] pb-5"><div><h2 className="m-0 text-lg font-black text-[#19312f]">{detail.data.ticket.subject}</h2><p className="mb-0 mt-2 text-xs text-[#71857c]">{categoryText[detail.data.ticket.category]} · {dateLabel(detail.data.ticket.createdAt)}</p>{admin && <p className="mb-0 mt-1 text-xs text-[#536762]">{detail.data.ticket.ownerName || "کاربر"} · {detail.data.ticket.ownerEmail || detail.data.ticket.ownerPhone || ""}</p>}</div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusStyle[detail.data.ticket.status]}`}>{statusText[detail.data.ticket.status]}</span></div>
            <div className="grid gap-2.5 py-4">
              {detail.data.ticket.messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 ${message.authorRole === "support" ? "mr-auto bg-[#edf7f1]" : "ml-auto bg-[#f3f5f2]"}`}
                >
                  <div className="mb-0.5 text-[11px] font-bold text-[#0f7b62]">
                    {message.authorRole === "support" ? "پشتیبانی" : "کاربر"}
                  </div>
                  <p className="m-0 whitespace-pre-wrap break-words text-sm leading-6 text-[#19312f]">{message.body}</p>
                  <time className="mt-1 block text-[10px] text-[#86968d]">{dateLabel(message.createdAt)}</time>
                </div>
              ))}
            </div>
            {admin && <div className="mb-5 flex gap-3 border-t border-[#e9efea] pt-4"><button type="button" disabled={changeStatus.isPending} onClick={() => changeStatus.mutate(detail.data.ticket.status === "closed" ? "open" : "closed")} className="inline-flex items-center gap-2 text-xs font-bold text-[#0f7b62]">{detail.data.ticket.status === "closed" ? <ArrowLeft size={15} /> : <CheckCircle2 size={15} />}{detail.data.ticket.status === "closed" ? "باز کردن تیکت" : "بستن تیکت"}</button></div>}
            {detail.data.ticket.status !== "closed" && <form className="grid gap-3 border-t border-[#e9efea] pt-5" onSubmit={replyForm.handleSubmit((input) => reply.mutate(input))}>
              <FormField label={admin ? "پاسخ پشتیبانی" : "پیام جدید"} htmlFor="support-reply" required error={replyForm.formState.errors.message?.message}>
                <TextAreaField id="support-reply" aria-invalid={Boolean(replyForm.formState.errors.message)} {...replyForm.register("message")} placeholder="پیامت را بنویس…" />
              </FormField>
              <button type="submit" disabled={reply.isPending} className="inline-flex w-fit justify-self-end items-center gap-2 rounded-xl bg-[#0f7b62] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Send size={16} /> ارسال پیام</button>
            </form>}
          </> : <div className="grid min-h-72 place-content-center justify-items-center gap-3 text-center text-[#71857c]"><MessageSquareText size={32} /><p className="m-0 text-sm">{admin ? "یک تیکت را برای بررسی انتخاب کن." : "برای شروع یک تیکت بساز یا تیکت قبلی را باز کن."}</p></div>}
        </section>
      </div>
    </main>
  );
}
