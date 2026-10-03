"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Settings2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TextField } from "@/app/_components/text-field";
import { useToast } from "@/app/_components/toast";
import { RadicoinIcon } from "@/app/(panel)/_components/radicoin-icon";
import { useRadicoinAdminSettings, useUpdateRadicoinSettings } from "@/lib/radicoins";

const radicoinSettingsSchema = z.object({
  dailyLoginCoins: z.number().int().min(0),
  dailyActivityCoinCap: z.number().int().min(0),
  activityCoins: z.number().int().min(0),
  referrerSignupCoins: z.number().int().min(0),
  referredSignupCoins: z.number().int().min(0),
  referrerActivationCoins: z.number().int().min(0),
  referredActivationCoins: z.number().int().min(0),
  referrerUpgradeCoins: z.number().int().min(0),
  purchaserCoins: z.number().int().min(0),
  planCosts: z.record(z.string(), z.number().int().min(0)),
});

type RadicoinSettingsFormValues = z.infer<typeof radicoinSettingsSchema>;

const numberValue = { setValueAs: (value: string) => Number(value) };

const rewardFields: Array<[keyof Omit<RadicoinSettingsFormValues, "planCosts">, string]> = [
  ["dailyLoginCoins", "پاداش ورود روزانه"],
  ["activityCoins", "پاداش هر فعالیت هزینه‌بر"],
  ["dailyActivityCoinCap", "سقف روزانه فعالیت"],
  ["referrerSignupCoins", "دعوت‌کننده پس از ثبت‌نام"],
  ["referredSignupCoins", "هدیه ثبت‌نام دعوت‌شونده"],
  ["referrerActivationCoins", "دعوت‌کننده پس از فعالیت جدی"],
  ["referredActivationCoins", "هدیه فعالیت جدی دعوت‌شونده"],
  ["referrerUpgradeCoins", "دعوت‌کننده پس از ارتقا"],
  ["purchaserCoins", "هدیه خرید کاربر"],
];

export function RadicoinSettingsForm() {
  const notify = useToast();
  const settings = useRadicoinAdminSettings();
  const update = useUpdateRadicoinSettings();
  const form = useForm<RadicoinSettingsFormValues>({
    resolver: zodResolver(radicoinSettingsSchema),
    defaultValues: {
      dailyLoginCoins: 2,
      dailyActivityCoinCap: 15,
      activityCoins: 3,
      referrerSignupCoins: 40,
      referredSignupCoins: 30,
      referrerActivationCoins: 80,
      referredActivationCoins: 50,
      referrerUpgradeCoins: 200,
      purchaserCoins: 30,
      planCosts: {},
    },
  });

  useEffect(() => {
    if (!settings.data) return;

    form.reset({
      ...settings.data.settings,
      planCosts: Object.fromEntries(settings.data.plans.map((plan) => [plan.id, plan.radicoinCost ?? 0])),
    });
  }, [form, settings.data]);

  const save = form.handleSubmit(async (values) => {
    try {
      const { planCosts, ...input } = values;
      await update.mutateAsync({
        ...input,
        planCosts: Object.entries(planCosts).map(([id, cost]) => ({ id, radicoinCost: cost > 0 ? cost : null })),
      });
      notify("تنظیمات رادیکوین ذخیره شد.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "ذخیره تنظیمات ناموفق بود.", "error");
    }
  });

  return (
    <form className="grid gap-5 rounded-[20px] border border-[#e3e9e3] bg-white p-6" onSubmit={save}>
      <div>
        <h2 className="m-0 flex items-center gap-2 text-[13px] font-extrabold text-[#19312f]">
          <RadicoinIcon size={18} /> موتور پاداش و فروشگاه
        </h2>
        <p className="mb-0 mt-2 text-[10px] leading-6 text-[#7c8b88]">
          نرخ پاداش‌ها و هزینهٔ ارتقای پلن با رادیکوین را از اینجا مدیریت کن.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {rewardFields.map(([name, label]) => (
          <label className="grid gap-2 text-[11px] font-normal text-[#596c67]" key={name}>
            {label}
            <TextField inputMode="numeric" {...form.register(name, numberValue)} />
          </label>
        ))}
      </div>

      <div className="border-t border-[#edf1ee] pt-5">
        <h3 className="m-0 flex items-center gap-2 text-[12px] font-extrabold text-[#405753]">
          <Settings2 size={16} /> قیمت فروشگاه
        </h3>
        <p className="mb-0 mt-2 text-[10px] leading-6 text-[#7c8b88]">
          هزینهٔ هر پلن با رادیکوین؛ مقدار صفر یعنی امکان ارتقا با رادیکوین برای آن پلن غیرفعال است.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(settings.data?.plans ?? []).map((plan) => (
            <label className="grid gap-2 text-[11px] font-normal text-[#596c67]" key={plan.id}>
              {plan.name}
              <TextField inputMode="numeric" {...form.register(`planCosts.${plan.id}`, numberValue)} />
            </label>
          ))}
        </div>
      </div>

      <div className="flex border-t border-[#edf1ee] pt-4">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0f7b62] px-5 text-[10px] font-bold text-white disabled:opacity-50"
          disabled={update.isPending || settings.isLoading}
          type="submit"
        >
          {update.isPending && <LoaderCircle className="animate-spin" size={15} />}
          ذخیره تنظیمات رادیکوین
        </button>
      </div>
    </form>
  );
}
