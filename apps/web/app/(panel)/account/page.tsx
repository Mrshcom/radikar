"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Download,
  FileText,
  MessagesSquare,
  Save,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, type ComponentType } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authQueryKey, useAuth, type CurrentUser } from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";
import { useMembership, type Membership } from "@/lib/billing";

const schema = z.object({
  fullName: z.string().trim().min(2, "نام باید حداقل دو حرف باشد.").max(100),
});
type Values = z.infer<typeof schema>;
type UsageKey = keyof Membership["usage"];

const usageItems: Array<{
  key: UsageKey;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}> = [
  { key: "resume", label: "ساخت رزومه", description: "تعداد رزومه‌های قابل ساخت", icon: FileText },
  { key: "pdf", label: "دانلود PDF", description: "خروجی‌های قابل دریافت", icon: Download },
  { key: "ai", label: "اعتبار هوش مصنوعی", description: "عملیات تولید و بهبود محتوا", icon: Sparkles },
  { key: "match", label: "تطبیق شغلی", description: "تحلیل رزومه با فرصت شغلی", icon: Target },
  { key: "interview", label: "مصاحبه آزمایشی", description: "جلسه‌های تمرین مصاحبه", icon: MessagesSquare },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(new Date(value));
}

function remainingDays(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

function UsageCard({ item, membership }: { item: (typeof usageItems)[number]; membership: Membership }) {
  const value = membership.usage[item.key];
  const Icon = item.icon;
  const exhausted = value.remaining === 0;
  const percent = value.total === null
    ? 0
    : value.total === 0
      ? 100
      : Math.min(100, Math.round((value.used / value.total) * 100));

  return (
    <article className="grid min-w-0 gap-4 rounded-[17px] border border-[#e2e9e4] bg-white p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#edf7f2] text-[#0f7b62]">
          <Icon size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-[12px] text-[#233d38]">{item.label}</strong>
          <small className="mt-1 block text-[9px] leading-5 text-[#899792]">{item.description}</small>
        </span>
        <span className={exhausted ? "rounded-full bg-[#fff0ed] px-2.5 py-1 text-[8px] font-bold text-[#b65343]" : "rounded-full bg-[#edf7f2] px-2.5 py-1 text-[8px] font-bold text-[#14705a]"}>
          {value.remaining === null ? "نامحدود" : exhausted ? "تمام شده" : `${value.remaining.toLocaleString("fa-IR")} باقی‌مانده`}
        </span>
      </div>
      {value.total !== null && (
        <div className="grid gap-2">
          <div className="h-2 overflow-hidden rounded-full bg-[#edf1ed]">
            <div className={exhausted ? "h-full rounded-full bg-[#d66f5c]" : "h-full rounded-full bg-[#2e9b7d]"} style={{ width: `${percent}%` }} />
          </div>
          <div className="flex items-center justify-between text-[9px] text-[#73827e]">
            <span>{value.used.toLocaleString("fa-IR")} مصرف‌شده</span>
            <span>از {value.total.toLocaleString("fa-IR")}</span>
          </div>
        </div>
      )}
      {value.total === null && (
        <p className="m-0 text-[9px] text-[#73827e]">تا امروز {value.used.toLocaleString("fa-IR")} مورد استفاده شده و سقف مصرف نامحدود است.</p>
      )}
    </article>
  );
}

function MembershipSkeleton() {
  return <div className="h-[390px] animate-pulse rounded-[20px] border border-[#e6ebe7] bg-[#f3f6f3]" aria-label="در حال دریافت وضعیت پلن" />;
}

export default function AccountPage() {
  const { user } = useAuth();
  const membership = useMembership();
  const queryClient = useQueryClient();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { fullName: "" } });

  useEffect(() => form.reset({ fullName: user?.fullName ?? "" }), [form, user?.fullName]);

  const update = useMutation({
    mutationFn: (input: Values) => apiRequest<{ user: CurrentUser }>("/api/account", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: authQueryKey }),
  });

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6">
      <header>
        <span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><UserRound size={18} /> حساب کاربری</span>
        <h1 className="mb-0 mt-3 text-[26px] font-black">اطلاعات حساب و میزان مصرف</h1>
        <p className="mb-0 mt-2 text-[10px] leading-6 text-[#7c8c87]">وضعیت عضویت، زمان و اعتبار باقی‌مانده را یکجا ببین.</p>
      </header>

      {membership.isPending && <MembershipSkeleton />}
      {membership.isError && (
        <div className="rounded-[18px] border border-[#f0d7d0] bg-[#fff7f4] p-5 text-[10px] text-[#a44d3e]">دریافت وضعیت پلن ممکن نشد. کمی بعد دوباره تلاش کن.</div>
      )}
      {membership.data && (
        <section className="grid gap-5 rounded-[20px] border border-[#dfe8e2] bg-[#f8fbf9] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[9px] font-bold text-[#768782]">پلن فعال</span>
              <h2 className="mb-0 mt-1 text-[20px] font-black text-[#193a33]">{membership.data.plan.name}</h2>
            </div>
            <div className="flex items-center gap-3 rounded-[14px] border border-[#d8e6de] bg-white px-4 py-3">
              <CalendarDays className="text-[#178066]" size={19} />
              <span>
                <strong className="block text-[12px] text-[#27453e]">{remainingDays(membership.data.expiresAt).toLocaleString("fa-IR")} روز باقی‌مانده</strong>
                <small className="mt-1 block text-[8px] text-[#82908c]">اعتبار تا {formatDate(membership.data.expiresAt)}</small>
              </span>
            </div>
            <Link className="inline-flex min-h-11 items-center rounded-[11px] bg-[#0f7b62] px-4 text-[10px] font-bold text-white no-underline" href="/upgrade">خرید یا ارتقای بسته</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {usageItems.map((item) => <UsageCard item={item} key={item.key} membership={membership.data} />)}
          </div>
        </section>
      )}

      <form className="grid gap-5 rounded-[20px] border border-[#e3e9e3] bg-white p-6" onSubmit={form.handleSubmit((values) => update.mutate(values))}>
        <h2 className="m-0 text-[16px] font-black text-[#263d38]">اطلاعات فردی</h2>
        <label className="grid gap-2 text-[10px] font-bold">نام و نام خانوادگی<input className="h-12 rounded-[11px] border border-[#dfe6e0] px-4 text-[12px] outline-none focus:border-[#79b8a5]" {...form.register("fullName")} /></label>
        {form.formState.errors.fullName && <p className="m-0 text-[10px] text-[#b14848]">{form.formState.errors.fullName.message}</p>}
        <label className="grid gap-2 text-[10px] font-bold">شماره همراه<input className="h-12 rounded-[11px] border border-[#e5e9e5] bg-[#f5f7f4] px-4 text-[12px] text-[#72817e]" dir="ltr" readOnly value={user?.phone ?? ""} /></label>
        <p className="m-0 text-[9px] leading-6 text-[#87938f]">شماره همراه شناسه یکتای ورود است و امکان تغییر آن وجود ندارد.</p>
        {update.isSuccess && <p className="m-0 text-[10px] text-[#14705a]">اطلاعات حساب ذخیره شد.</p>}
        <button className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[11px] border-0 bg-[#0f7b62] px-5 text-[11px] font-bold text-white disabled:opacity-40" disabled={update.isPending} type="submit"><Save size={16} /> ذخیره تغییرات</button>
      </form>
    </div>
  );
}
