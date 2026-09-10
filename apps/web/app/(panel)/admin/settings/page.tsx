"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, CheckCircle2, DollarSign, LoaderCircle, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/app/_components/auth";
import { useToast } from "@/app/_components/toast";
import {
  useAdminAiSettings,
  useUpdateAdminAiSettings,
} from "@/lib/admin-stats";

const schema = z.object({
  provider: z.enum(["freeDeepseekAPI", "gapgpt"]),
  model: z.string().trim().max(120),
  search: z.string(),
  dollarRateRials: z.number().int().min(0).max(1_000_000_000),
});
type FormValues = z.infer<typeof schema>;

function SettingsSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6" aria-busy="true" aria-label="در حال دریافت تنظیمات">
      <header className="grid gap-3">
        <span className="h-5 w-36 animate-pulse rounded-md bg-[#e4ece8]" />
        <span className="h-8 w-32 animate-pulse rounded-md bg-[#e4ece8]" />
        <span className="h-4 w-3/4 animate-pulse rounded-md bg-[#edf2ef]" />
      </header>
      <div className="flex gap-2 border-b border-[#e3e9e3]">
        <span className="h-11 w-32 animate-pulse rounded-t-md bg-[#e8efeb]" />
        <span className="h-11 w-24 animate-pulse rounded-t-md bg-[#f0f4f1]" />
      </div>
      <section className="grid gap-5 rounded-[20px] border border-[#e3e9e3] bg-white p-6">
        <span className="h-5 w-32 animate-pulse rounded-md bg-[#e4ece8]" />
        <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
          {[1, 2].map((item) => <span className="h-[70px] animate-pulse rounded-xl border border-[#edf1ee] bg-[#f1f5f2]" key={item} />)}
        </div>
        <span className="h-11 w-full animate-pulse rounded-[10px] bg-[#f1f5f2]" />
        <span className="h-11 w-full animate-pulse rounded-[10px] bg-[#f1f5f2]" />
        <div className="flex items-center justify-between border-t border-[#edf0ec] pt-4">
          <span className="h-4 w-44 animate-pulse rounded-md bg-[#edf2ef]" />
          <span className="h-10 w-32 animate-pulse rounded-[10px] bg-[#dce9e2]" />
        </div>
      </section>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const notify = useToast();
  const isSuperadmin = user?.role === "superadmin";
  const [tab, setTab] = useState<"models" | "currency">("models");
  const settings = useAdminAiSettings(isSuperadmin);
  const update = useUpdateAdminAiSettings();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { provider: "gapgpt", model: "gapgpt-qwen-3.6", search: "", dollarRateRials: 0 },
  });
  const provider = useWatch({ control: form.control, name: "provider" });
  const modelSearch = useWatch({ control: form.control, name: "search" });
  const selectedModel = useWatch({ control: form.control, name: "model" });
  const dollarRateRials = useWatch({ control: form.control, name: "dollarRateRials" });
  const gapGptModels = useMemo(
    () =>
      (settings.data?.providers.find((item) => item.id === "gapgpt")?.models ?? [])
        .filter((item) => item.id.toLowerCase().includes(modelSearch.trim().toLowerCase())),
    [modelSearch, settings.data],
  );

  useEffect(() => {
    if (!settings.data) return;
    form.reset({
      provider: settings.data.current.provider,
      model: settings.data.current.model,
      search: "",
      dollarRateRials: settings.data.current.dollarRateRials,
    });
  }, [form, settings.data]);

  if (!isSuperadmin) return null;
  if (settings.isLoading) return <SettingsSkeleton />;

  const submit = form.handleSubmit(async (values) => {
    const selected = settings.data?.providers.find((item) => item.id === values.provider);
    try {
      const result = await update.mutateAsync({
        provider: values.provider,
        model: values.model.trim() || selected?.defaultModel,
        dollarRateRials: values.dollarRateRials,
      });
      form.reset({ provider: result.provider, model: result.model, search: "", dollarRateRials: result.dollarRateRials });
      notify("تنظیمات مدل‌های تحلیلی ذخیره شد.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "ذخیره تنظیمات ناموفق بود.", "error");
    }
  });

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <header>
        <span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><Settings2 size={18} /> تنظیمات سوپرادمین</span>
        <h1 className="mb-0 mt-3 text-[26px] font-black text-[#19312f]">تنظیمات</h1>
        <p className="mb-0 mt-2 text-[10px] leading-7 text-[#7c8b88]">Provider انتخاب‌شده برای تحلیل تطابق و عملیات تحلیلی همه کاربران استفاده می‌شود.</p>
      </header>

      <div className="flex gap-2 border-b border-[#e3e9e3]">
        <button type="button" onClick={() => setTab("models")} className={`border-b-2 px-4 py-3 text-[10px] font-bold ${tab === "models" ? "border-[#0f7b62] text-[#0f7b62]" : "border-transparent text-[#7c8b88]"}`}><Bot size={14} className="ml-1 inline" /> مدل‌های تحلیلی</button>
        <button type="button" onClick={() => setTab("currency")} className={`border-b-2 px-4 py-3 text-[10px] font-bold ${tab === "currency" ? "border-[#0f7b62] text-[#0f7b62]" : "border-transparent text-[#7c8b88]"}`}><DollarSign size={14} className="ml-1 inline" /> نرخ دلار</button>
      </div>

      <form className="grid gap-5 rounded-[20px] border border-[#e3e9e3] bg-white p-6" onSubmit={submit}>
        {tab === "models" ? <div className="grid gap-3">
          <h2 className="m-0 flex items-center gap-2 text-[13px] font-extrabold text-[#19312f]"><Bot size={17} className="text-[#0f7b62]" /> Provider تحلیل</h2>
          <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
            {(settings.data?.providers ?? [
              { id: "freeDeepseekAPI" as const, label: "DeepSeek Local", defaultModel: "deepseek-chat" },
              { id: "gapgpt" as const, label: "GapGPT", defaultModel: "gapgpt-qwen-3.6", models: [] },
            ]).map((item) => (
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-right transition-colors ${provider === item.id ? "border-[#83bfab] bg-[#edf7f2]" : "border-[#e3e9e3] bg-[#fbfcfa]"}`} key={item.id}>
                <input className="accent-[#0f7b62]" type="radio" value={item.id} {...form.register("provider")} />
                <span><strong className="block text-[11px] text-[#19312f]">{item.label}</strong><small className="mt-1 block text-[9px] text-[#7c8b88]">مدل پیش‌فرض: <bdi>{item.defaultModel}</bdi></small></span>
              </label>
            ))}
          </div>
        </div> : <div className="grid gap-3">
          <h2 className="m-0 flex items-center gap-2 text-[13px] font-extrabold text-[#19312f]"><DollarSign size={17} className="text-[#0f7b62]" /> نرخ روز دلار</h2>
          <label className="flex items-center gap-3 text-[10px] font-bold text-[#536562]">قیمت هر دلار به تومان<input type="text" inputMode="numeric" dir="ltr" className="min-w-0 flex-1 rounded-[10px] border border-[#dfe5df] bg-[#fbfcfa] px-3 py-3 text-left text-[12px] outline-0 focus:border-[#9bc8b8]" value={Number(dollarRateRials || 0).toLocaleString("en-US")} onChange={(event) => { const value = Number(event.target.value.replace(/[^0-9]/g, "")); form.setValue("dollarRateRials", Number.isFinite(value) ? value : 0, { shouldDirty: true, shouldValidate: true }); }} /></label>
          <small className="font-normal text-[#899793]">این نرخ برای نمایش معادل تومانی هزینه‌های برآوردی استفاده می‌شود.</small>
        </div>}

        {tab === "models" && provider === "gapgpt" && (
          <div className="grid gap-2 text-[10px] font-bold text-[#536562]">
            <label className="grid gap-2">
              جست‌وجوی مدل GapGPT
              <input className="w-full rounded-[10px] border border-[#dfe5df] bg-[#fbfcfa] px-3 py-3 text-[11px] outline-0 focus:border-[#9bc8b8]" placeholder="مثلاً qwen یا gpt" {...form.register("search")} dir="ltr" />
            </label>
            <input type="hidden" {...form.register("model")} />
            <div className="grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-[#e3e9e3] bg-[#fbfcfa] p-2">
              {gapGptModels.length ? gapGptModels.map((item) => (
                <button className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-right ${selectedModel === item.id ? "border-[#83bfab] bg-[#edf7f2]" : "border-transparent bg-white hover:border-[#dcebe4]"}`} key={item.id} onClick={() => form.setValue("model", item.id, { shouldDirty: true })} type="button">
                  <bdi dir="ltr" className="text-[10px] text-[#19312f]">{item.id}</bdi>
                  <small className="shrink-0 text-[8px] font-normal text-[#899793]" dir="ltr">${item.inputPrice}/M ورودی · ${item.outputPrice}/M خروجی</small>
                </button>
              )) : <p className="m-0 px-2 py-4 text-center text-[9px] font-normal text-[#899793]">مدلی با این جست‌وجو پیدا نشد.</p>}
            </div>
            <small className="font-normal leading-6 text-[#899793]">مدل انتخاب‌شده: <bdi dir="ltr">{selectedModel}</bdi> — کلید API و Base URL فقط در API نگهداری می‌شوند.</small>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-[#edf0ec] pt-4 max-[560px]:flex-col-reverse max-[560px]:items-stretch">
          <span className="flex items-center gap-1.5 text-[9px] text-[#7c8b88]">{settings.data?.current.configured ? <><CheckCircle2 size={14} className="text-[#0f7b62]" /> Provider پیکربندی شده است</> : "کلید Provider در محیط API تنظیم نشده است."}</span>
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border-0 bg-[#0f7b62] px-5 text-[10px] font-bold text-white disabled:opacity-50" disabled={update.isPending || settings.isLoading} type="submit">{update.isPending && <LoaderCircle className="animate-spin" size={15} />} ذخیره تنظیمات</button>
        </div>
      </form>
    </div>
  );
}
