"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, BriefcaseBusiness, CheckCircle2, DollarSign, Gift, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
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
import { ConfirmActionModal, SectionTitle } from "../../_components/ui";
import { RadicoinIcon } from "../../_components/radicoin-icon";
import { FormField } from "../../_components/form-field";
import { RadicoinSettingsForm } from "./_components/radicoin-settings-form";
import { ReferralSettingsForm } from "./_components/referral-settings-form";

type AdminSettingsTab = "models" | "currency" | "jobPool" | "radicoins" | "referrals";

const settingsTabs: Array<{
  id: AdminSettingsTab;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string; size?: number }>;
}> = [
  { id: "models", label: "مدل‌های تحلیلی", description: "Provider و مدل AI", icon: Bot },
  { id: "jobPool", label: "Job Pool", description: "دریافت فرصت شغلی", icon: BriefcaseBusiness },
  { id: "currency", label: "نرخ دلار", description: "نمایش هزینه‌ها", icon: DollarSign },
  { id: "radicoins", label: "اقتصاد رادیکوین", description: "پاداش و فروشگاه", icon: RadicoinIcon },
  { id: "referrals", label: "ریفرال", description: "دعوت کاربران", icon: Gift },
];

const schema = z.object({
  provider: z.enum(["freeDeepseekAPI", "gapgpt"]),
  model: z.string().trim().max(120),
  search: z.string(),
  dollarRateRials: z.number().int().min(0).max(1_000_000_000),
});
type FormValues = z.infer<typeof schema>;
const jobPoolSchema = z.object({
  enabled: z.boolean(),
  dailyLimit: z
    .number({ error: "حداکثر نتیجه روزانه الزامی است." })
    .int("مقدار باید عدد صحیح باشد.")
    .min(150, "حداقل ۱۵۰ نتیجه وارد کن.")
    .max(500, "حداکثر ۵۰۰ نتیجه مجاز است."),
  intervalHours: z
    .number({ error: "فاصله اجرای Worker الزامی است." })
    .int("مقدار باید عدد صحیح باشد.")
    .min(1, "حداقل یک ساعت وارد کن.")
    .max(24, "حداکثر ۲۴ ساعت مجاز است."),
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
  const [tab, setTab] = useState<AdminSettingsTab>("models");
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [jobPoolEnabledChange, setJobPoolEnabledChange] = useState<boolean | null>(null);
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
  const jobPoolEnabled = useWatch({ control: jobPoolForm.control, name: "enabled" });
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
  if ((tab === "models" || tab === "currency") && settings.isLoading) return <SettingsSkeleton />;

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
  const confirmJobPoolEnabledChange = async () => {
    if (jobPoolEnabledChange == null) return;

    const isValid = await jobPoolForm.trigger();
    if (!isValid) {
      notify("پیش از تغییر وضعیت، فیلدهای Job Pool را کامل کن.", "error");
      setJobPoolEnabledChange(null);
      return;
    }

    try {
      const currentValues = jobPoolForm.getValues();
      const savedSettings = await updateJobPool.mutateAsync({
        ...currentValues,
        enabled: jobPoolEnabledChange,
        locations: splitJobPoolLocations(currentValues.locations),
      });
      jobPoolForm.reset({ ...savedSettings, locations: savedSettings.locations.join("\n") });
      notify(jobPoolEnabledChange ? "Job Pool فعال شد." : "Job Pool غیرفعال شد.");
      setJobPoolEnabledChange(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : "تغییر وضعیت Job Pool ناموفق بود.", "error");
    }
  };
  return (
    <div className="grid w-full gap-6">
      <SectionTitle
        description="تنظیمات مرکزی تحلیل، دریافت آگهی، اقتصاد رادیکوین و سیستم ریفرال را از اینجا مدیریت کن."
        title="تنظیمات"
      />

      <div className="grid items-start gap-6 min-[900px]:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="grid gap-1.5 rounded-[20px] border border-[#e1e8e2] bg-white p-2.5 shadow-[0_12px_30px_rgba(31,76,64,.04)] min-[900px]:sticky min-[900px]:top-6">
          <span className="px-2 py-1 text-[9px] font-bold text-[#9aa7a3]">بخش‌های تنظیمات</span>
          {settingsTabs.map(({ id, label, description, icon: Icon }) => {
            const isActive = tab === id;
            return (
              <button
                className={`group flex items-center gap-3 rounded-[13px] px-3 py-3 text-right transition ${
                  isActive
                    ? "bg-[#eaf5f0] text-[#0f7b62] shadow-[inset_0_0_0_1px_#b9ddcf]"
                    : "text-[#6f807c] hover:bg-[#f5f8f5] hover:text-[#405753]"
                }`}
                key={id}
                onClick={() => setTab(id)}
                type="button"
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-[11px] ${
                    isActive ? "bg-white text-[#0f7b62]" : "bg-[#f1f5f2] text-[#71827e] group-hover:bg-white"
                  }`}
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-[11px] font-bold">{label}</strong>
                  <small className="mt-0.5 block text-[9px] font-normal text-[#91a09c]">{description}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {tab === "radicoins" ? (
            <RadicoinSettingsForm />
          ) : tab === "referrals" ? (
            <ReferralSettingsForm />
          ) : (
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
                    <Checkbox
                      checked={jobPoolEnabled}
                      disabled={updateJobPool.isPending}
                      onChange={(event) => setJobPoolEnabledChange(event.target.checked)}
                    />
                  </label>
                  <FormField
                    error={jobPoolForm.formState.errors.locations?.message}
                    label="موقعیت‌های جست‌وجو"
                    required
                  >
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
                      invalid={Boolean(jobPoolForm.formState.errors.locations)}
                    />
                    <span className="font-normal text-[10px] text-[#899793]">
                      نام Location در Actor متن آزاد انگلیسی است. از فهرست جست‌وجو کن یا شهر/کشور دیگری را وارد کن؛ بدون
                      انتخاب موقعیت، Apify اجرا نمی‌شود.
                    </span>
                  </FormField>
                  <div className="grid gap-4 min-[700px]:grid-cols-2">
                    <FormField
                      error={jobPoolForm.formState.errors.dailyLimit?.message}
                      hint="بین ۱۵۰ تا ۵۰۰ نتیجه"
                      label="حداکثر نتیجه روزانه"
                      required
                    >
                      <TextField
                        aria-invalid={Boolean(jobPoolForm.formState.errors.dailyLimit)}
                        type="number"
                        min="150"
                        max="500"
                        {...jobPoolForm.register("dailyLimit", { valueAsNumber: true })}
                      />
                    </FormField>
                    <FormField
                      error={jobPoolForm.formState.errors.intervalHours?.message}
                      hint="حداکثر هر ۲۴ ساعت یک اجرا"
                      label="فاصله اجرای Worker (ساعت)"
                      required
                    >
                      <TextField
                        aria-invalid={Boolean(jobPoolForm.formState.errors.intervalHours)}
                        type="number"
                        min="1"
                        max="24"
                        {...jobPoolForm.register("intervalHours", { valueAsNumber: true })}
                      />
                    </FormField>
                  </div>
                  <FormField label="بازه انتشار آگهی" required>
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
                  </FormField>
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
                        {runJobPool.isPending && <LoaderCircle className="animate-spin" size={13} />} دریافت دستی
                        آگهی‌ها
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
                        <input
                          className="accent-[#0f7b62]"
                          type="radio"
                          value={item.id}
                          {...form.register("provider")}
                        />
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
                      onChange={(value) =>
                        form.setValue("model", String(value), { shouldDirty: true, shouldValidate: true })
                      }
                      placeholder="مدل را جست‌وجو و انتخاب کن"
                      searchPlaceholder="جست‌وجوی مدل..."
                      emptyLabel="مدلی با این جست‌وجو پیدا نشد."
                    />
                  </label>
                  <small className="font-normal leading-6 text-[#899793]">
                    مدل انتخاب‌شده: <bdi dir="ltr">{selectedModel}</bdi> — کلید API و Base URL فقط در API نگهداری
                    می‌شوند.
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
                    tab === "jobPool"
                      ? updateJobPool.isPending || jobPool.isLoading
                      : update.isPending || settings.isLoading
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
          )}
        </div>
      </div>
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
      {jobPoolEnabledChange != null && (
        <ConfirmActionModal
          title="تأیید تغییر وضعیت Job Pool"
          description={
            jobPoolEnabledChange
              ? "دریافت متمرکز فرصت‌های شغلی فعال شود؟ Worker طبق زمان‌بندی فعلی اجرا می‌شود."
              : "دریافت متمرکز فرصت‌های شغلی غیرفعال شود؟ اجرای دوره‌ای Worker متوقف می‌شود."
          }
          confirmIcon={<BriefcaseBusiness size={15} />}
          confirmLabel={jobPoolEnabledChange ? "بله، فعال شود" : "بله، غیرفعال شود"}
          pending={updateJobPool.isPending}
          tone={jobPoolEnabledChange ? "primary" : "danger"}
          onCancel={() => setJobPoolEnabledChange(null)}
          onConfirm={() => void confirmJobPoolEnabledChange()}
        />
      )}
    </div>
  );
}
