"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, BriefcaseBusiness, CheckCircle2, DollarSign, LoaderCircle, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/app/_components/auth";
import { Checkbox } from "@/app/_components/checkbox";
import { SearchableSelect } from "@/app/_components/searchable-select";
import { TextField } from "@/app/_components/text-field";
import { useToast } from "@/app/_components/toast";
import { formatGroupedNumber, normalizeNumericInput } from "@/lib/fa-number";
import {
  useAdminAiSettings,
  useAdminJobPoolSettings,
  useUpdateAdminAiSettings,
  useUpdateAdminJobPoolSettings,
  useRunAdminJobPoolSync,
} from "@/lib/admin-stats";
import { SettingsSkeleton } from "../../_components/skeletons";
import { ConfirmActionModal } from "../../_components/ui";

const schema = z.object({
  provider: z.enum(["freeDeepseekAPI", "gapgpt"]),
  model: z.string().trim().max(120),
  search: z.string(),
  dollarRateRials: z.number().int().min(0).max(1_000_000_000),
});
type FormValues = z.infer<typeof schema>;
const jobPoolSchema = z.object({
  enabled: z.boolean(),
  dailyLimit: z.number().int().min(150).max(500),
  intervalHours: z.number().int().min(1).max(24),
  publishedAt: z.enum(["r86400", "r604800", "r2592000"]),
  locations: z.string().trim().min(2, "حداقل یک موقعیت جست‌وجو وارد کن.").max(500),
});
type JobPoolFormValues = z.infer<typeof jobPoolSchema>;

const jobPoolLocationOptions = [
  "Germany",
  "Netherlands",
  "Tehran, Iran",
  "Dubai, United Arab Emirates",
  "Istanbul, Türkiye",
  "Riyadh, Saudi Arabia",
  "Doha, Qatar",
  "Berlin, Germany",
  "Amsterdam, Netherlands",
  "London, United Kingdom",
  "Stockholm, Sweden",
  "Toronto, Canada",
  "Vancouver, Canada",
  "New York, United States",
  "San Francisco, California, United States",
  "Sydney, Australia",
  "Singapore",
] as const;
const defaultJobPoolLocations = ["Germany", "Netherlands"];

function splitJobPoolLocations(value: string) {
  return [
    ...new Set(
      value
        .split(/\r?\n/)
        .map((location) => location.trim())
        .filter(Boolean),
    ),
  ];
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const notify = useToast();
  const isSuperadmin = user?.role === "superadmin";
  const [tab, setTab] = useState<"models" | "currency" | "jobPool">("models");
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const settings = useAdminAiSettings(isSuperadmin);
  const update = useUpdateAdminAiSettings();
  const jobPool = useAdminJobPoolSettings(isSuperadmin);
  const updateJobPool = useUpdateAdminJobPoolSettings();
  const runJobPool = useRunAdminJobPoolSync();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { provider: "gapgpt", model: "gapgpt-qwen-3.6", search: "", dollarRateRials: 0 },
  });
  const jobPoolForm = useForm<JobPoolFormValues>({
    resolver: zodResolver(jobPoolSchema),
    defaultValues: {
      enabled: false,
      dailyLimit: 500,
      intervalHours: 24,
      publishedAt: "r86400",
      locations: defaultJobPoolLocations.join("\n"),
    },
  });
  const provider = useWatch({ control: form.control, name: "provider" });
  const selectedModel = useWatch({ control: form.control, name: "model" });
  const dollarRateRials = useWatch({ control: form.control, name: "dollarRateRials" });
  const jobPoolLocationsValue = useWatch({ control: jobPoolForm.control, name: "locations" });
  const publishedAt = useWatch({ control: jobPoolForm.control, name: "publishedAt" });
  const selectedJobPoolLocations = useMemo(() => splitJobPoolLocations(jobPoolLocationsValue), [jobPoolLocationsValue]);
  const gapGptModels = useMemo(
    () => settings.data?.providers.find((item) => item.id === "gapgpt")?.models ?? [],
    [settings.data],
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
  useEffect(() => {
    if (jobPool.data?.settings) {
      jobPoolForm.reset({
        ...jobPool.data.settings,
        locations: (jobPool.data.settings.locations.length
          ? jobPool.data.settings.locations
          : defaultJobPoolLocations
        ).join("\n"),
      });
    }
  }, [jobPool.data, jobPoolForm]);

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
      form.reset({
        provider: result.provider,
        model: result.model,
        search: "",
        dollarRateRials: result.dollarRateRials,
      });
      notify("تنظیمات مدل‌های تحلیلی ذخیره شد.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "ذخیره تنظیمات ناموفق بود.", "error");
    }
  });
  const submitJobPool = jobPoolForm.handleSubmit(async (values) => {
    try {
      await updateJobPool.mutateAsync({
        ...values,
        locations: splitJobPoolLocations(values.locations),
      });
      notify("تنظیمات دریافت متمرکز فرصت‌های شغلی ذخیره شد.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "ذخیره تنظیمات Job Pool ناموفق بود.", "error");
    }
  });
  const syncJobPool = async () => {
    try {
      const result = await runJobPool.mutateAsync();
      notify(
        `${result.receivedCount.toLocaleString("fa-IR")} آگهی دریافت شد؛ ${result.insertedCount.toLocaleString("fa-IR")} آگهی جدید ثبت شد.`,
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "دریافت دستی آگهی‌ها ناموفق بود.", "error");
    }
  };
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <header>
        <h1 className="mb-0 flex items-center gap-2 text-[26px] font-black text-[#19312f]">
          <Settings2 size={22} /> تنظیمات
        </h1>
        <p className="mb-0 mt-2 text-[10px] leading-7 text-[#7c8b88]">
          Provider انتخاب‌شده برای تحلیل تطابق و عملیات تحلیلی همه کاربران استفاده می‌شود.
        </p>
      </header>

      <div className="flex gap-2 border-b border-[#e3e9e3]">
        <button
          type="button"
          onClick={() => setTab("models")}
          className={`border-b-2 px-4 py-3 text-[10px] font-bold ${tab === "models" ? "border-[#0f7b62] text-[#0f7b62]" : "border-transparent text-[#7c8b88]"}`}
        >
          <Bot size={14} className="ml-1 inline" /> مدل‌های تحلیلی
        </button>
        <button
          type="button"
          onClick={() => setTab("jobPool")}
          className={`border-b-2 px-4 py-3 text-[10px] font-bold ${tab === "jobPool" ? "border-[#0f7b62] text-[#0f7b62]" : "border-transparent text-[#7c8b88]"}`}
        >
          <BriefcaseBusiness size={14} className="ml-1 inline" /> Job Pool
        </button>
        <button
          type="button"
          onClick={() => setTab("currency")}
          className={`border-b-2 px-4 py-3 text-[10px] font-bold ${tab === "currency" ? "border-[#0f7b62] text-[#0f7b62]" : "border-transparent text-[#7c8b88]"}`}
        >
          <DollarSign size={14} className="ml-1 inline" /> نرخ دلار
        </button>
      </div>

      <form
        className="grid gap-5 rounded-[20px] border border-[#e3e9e3] bg-white p-6"
        onSubmit={tab === "jobPool" ? submitJobPool : submit}
      >
        {tab === "jobPool" ? (
          <div className="grid gap-5">
            <div>
              <h2 className="m-0 flex items-center gap-2 text-[13px] font-extrabold text-[#19312f]">
                <BriefcaseBusiness size={17} className="text-[#0f7b62]" /> دریافت متمرکز فرصت شغلی
              </h2>
              <p className="mb-0 mt-2 text-[9px] leading-6 text-[#7c8b88]">
                این تنظیمات روی Worker مشترک اعمال می‌شوند و سقف روزانه از ۵۰۰ نتیجه بیشتر نمی‌رود.
              </p>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#e3e9e3] bg-[#fbfcfa] p-4 text-[10px] font-bold text-[#304943]">
              فعال‌سازی Job Pool
              <Checkbox {...jobPoolForm.register("enabled")} />
            </label>
            <div className="grid gap-2 text-[10px] font-bold text-[#536562]">
              <label htmlFor="job-pool-location">موقعیت‌های جست‌وجو</label>
              <input type="hidden" {...jobPoolForm.register("locations")} />
              <SearchableSelect
                allowCustom
                maxSelected={10}
                multiple
                searchable
                options={jobPoolLocationOptions.map((location) => ({ value: location, label: location }))}
                value={selectedJobPoolLocations}
                onChange={(value) =>
                  jobPoolForm.setValue("locations", (Array.isArray(value) ? value : [value]).join("\n"), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder="موقعیت‌ها را انتخاب یا جست‌وجو کن"
                searchPlaceholder="نام شهر یا کشور..."
              />
              <span className="font-normal text-[10px] text-[#899793]">
                نام Location در Actor متن آزاد انگلیسی است. از فهرست جست‌وجو کن یا شهر/کشور دیگری را وارد کن؛ بدون
                انتخاب موقعیت، Apify اجرا نمی‌شود.
              </span>
              {jobPoolForm.formState.errors.locations && (
                <small className="font-normal text-[#c44d4d]">{jobPoolForm.formState.errors.locations.message}</small>
              )}
            </div>
            <div className="grid gap-4 min-[700px]:grid-cols-2">
              <label className="grid gap-2 text-[10px] font-bold text-[#536562]">
                حداکثر نتیجه روزانه
                <TextField
                  type="number"
                  min="150"
                  max="500"
                  {...jobPoolForm.register("dailyLimit", { valueAsNumber: true })}
                />
                <small className="font-normal text-[#899793]">بین ۱۵۰ تا ۵۰۰ نتیجه</small>
              </label>
              <label className="grid gap-2 text-[10px] font-bold text-[#536562]">
                فاصله اجرای Worker (ساعت)
                <TextField
                  type="number"
                  min="1"
                  max="24"
                  {...jobPoolForm.register("intervalHours", { valueAsNumber: true })}
                />
                <small className="font-normal text-[#899793]">حداکثر هر ۲۴ ساعت یک اجرا</small>
              </label>
            </div>
            <label className="grid gap-2 text-[10px] font-bold text-[#536562]">
              بازه انتشار آگهی
              <SearchableSelect
                options={[
                  { value: "r86400", label: "۲۴ ساعت گذشته" },
                  { value: "r604800", label: "۷ روز گذشته" },
                  { value: "r2592000", label: "۳۰ روز گذشته" },
                ]}
                value={publishedAt}
                onChange={(value) =>
                  jobPoolForm.setValue("publishedAt", String(value) as JobPoolFormValues["publishedAt"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </label>
            {jobPool.data && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f4f8f5] px-4 py-3 text-[9px] leading-6 text-[#667773]">
                <span>
                  {jobPool.data.activeJobCount.toLocaleString("fa-IR")} آگهی فعال ·{" "}
                  {jobPool.data.activeSegmentCount.toLocaleString("fa-IR")} دسته فعال
                </span>
                <button
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[9px] border border-[#78bda5] bg-white px-3 text-[10px] font-extrabold text-[#0b6f58] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={runJobPool.isPending}
                  onClick={() => setSyncConfirmOpen(true)}
                  type="button"
                >
                  {runJobPool.isPending && <LoaderCircle className="animate-spin" size={13} />} دریافت دستی آگهی‌ها
                </button>
                <small className="basis-full text-[11px] text-[#7b8d88]">
                  اجرای دستی فاصله زمانی Worker را نادیده می‌گیرد، اما سقف نتیجه هر اجرا حفظ می‌شود.
                </small>
              </div>
            )}
          </div>
        ) : tab === "models" ? (
          <div className="grid gap-3">
            <h2 className="m-0 flex items-center gap-2 text-[13px] font-extrabold text-[#19312f]">
              <Bot size={17} className="text-[#0f7b62]" /> Provider تحلیل
            </h2>
            <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
              {(
                settings.data?.providers ?? [
                  { id: "freeDeepseekAPI" as const, label: "DeepSeek Local", defaultModel: "deepseek-chat" },
                  { id: "gapgpt" as const, label: "GapGPT", defaultModel: "gapgpt-qwen-3.6", models: [] },
                ]
              ).map((item) => (
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-right transition-colors ${provider === item.id ? "border-[#83bfab] bg-[#edf7f2]" : "border-[#e3e9e3] bg-[#fbfcfa]"}`}
                  key={item.id}
                >
                  <input className="accent-[#0f7b62]" type="radio" value={item.id} {...form.register("provider")} />
                  <span>
                    <strong className="block text-[11px] text-[#19312f]">{item.label}</strong>
                    <small className="mt-1 block text-[9px] text-[#7c8b88]">
                      مدل پیش‌فرض: <bdi>{item.defaultModel}</bdi>
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            <h2 className="m-0 flex items-center gap-2 text-[13px] font-extrabold text-[#19312f]">
              <DollarSign size={17} className="text-[#0f7b62]" /> نرخ روز دلار
            </h2>
            <label className="flex items-center gap-3 whitespace-nowrap text-[10px] font-bold text-[#536562]">
              قیمت هر دلار به تومان
              <TextField
                type="text"
                inputMode="numeric"
                dir="ltr"
                className="text-left"
                value={formatGroupedNumber(dollarRateRials)}
                onChange={(event) => {
                  const value = Number(normalizeNumericInput(event.target.value));
                  form.setValue("dollarRateRials", Number.isFinite(value) ? value : 0, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            </label>
            <small className="font-normal text-[#899793]">
              این نرخ برای نمایش معادل تومانی هزینه‌های برآوردی استفاده می‌شود.
            </small>
          </div>
        )}

        {tab === "models" && provider === "gapgpt" && (
          <div className="grid gap-2 text-[10px] font-bold text-[#536562]">
            <label className="grid gap-2">
              مدل GapGPT
              <SearchableSelect
                searchable
                options={gapGptModels.map((item) => ({ value: item.id, label: item.id }))}
                value={selectedModel}
                onChange={(value) => form.setValue("model", String(value), { shouldDirty: true, shouldValidate: true })}
                placeholder="مدل را جست‌وجو و انتخاب کن"
                searchPlaceholder="جست‌وجوی مدل..."
                emptyLabel="مدلی با این جست‌وجو پیدا نشد."
              />
            </label>
            <small className="font-normal leading-6 text-[#899793]">
              مدل انتخاب‌شده: <bdi dir="ltr">{selectedModel}</bdi> — کلید API و Base URL فقط در API نگهداری می‌شوند.
            </small>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-[#edf0ec] pt-4 max-[560px]:flex-col-reverse max-[560px]:items-stretch">
          <span className="flex items-center gap-1.5 text-[9px] text-[#7c8b88]">
            {tab === "jobPool" ? (
              "توکن Apify فقط در محیط API نگهداری می‌شود."
            ) : settings.data?.current.configured ? (
              <>
                <CheckCircle2 size={14} className="text-[#0f7b62]" /> Provider پیکربندی شده است
              </>
            ) : (
              "کلید Provider در محیط API تنظیم نشده است."
            )}
          </span>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border-0 bg-[#0f7b62] px-5 text-[10px] font-bold text-white disabled:opacity-50"
            disabled={
              tab === "jobPool" ? updateJobPool.isPending || jobPool.isLoading : update.isPending || settings.isLoading
            }
            type="submit"
          >
            {(tab === "jobPool" ? updateJobPool.isPending : update.isPending) && (
              <LoaderCircle className="animate-spin" size={15} />
            )}{" "}
            ذخیره تنظیمات
          </button>
        </div>
      </form>
      {syncConfirmOpen && (
        <ConfirmActionModal
          title="تأیید دریافت دستی آگهی‌ها"
          description="دریافت آگهی‌ها با تنظیمات فعلی Job Pool اجرا شود؟"
          confirmLabel="شروع دریافت"
          confirmIcon={<BriefcaseBusiness size={15} />}
          pending={runJobPool.isPending}
          onCancel={() => setSyncConfirmOpen(false)}
          onConfirm={() => {
            setSyncConfirmOpen(false);
            void syncJobPool();
          }}
        />
      )}
    </div>
  );
}
