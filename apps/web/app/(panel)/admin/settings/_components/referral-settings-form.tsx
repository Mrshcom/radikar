"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Checkbox } from "@/app/_components/checkbox";
import { useToast } from "@/app/_components/toast";
import { useReferralSettings, useUpdateReferralSettings, type ReferralSettings } from "@/lib/referrals";
import { ConfirmActionModal } from "@/app/(panel)/_components/ui";

const referralSettingsSchema = z.object({
  isActive: z.boolean(),
  referrerPoints: z.number().int().min(0).max(10_000),
  referredPoints: z.number().int().min(0).max(10_000),
});

type ReferralSettingsFormValues = z.infer<typeof referralSettingsSchema>;

export function ReferralSettingsForm() {
  const notify = useToast();
  const settings = useReferralSettings();
  const update = useUpdateReferralSettings();
  const [activeChange, setActiveChange] = useState<boolean | null>(null);
  const form = useForm<ReferralSettingsFormValues>({
    resolver: zodResolver(referralSettingsSchema),
    defaultValues: { isActive: true, referrerPoints: 100, referredPoints: 50 },
  });
  const isActive = useWatch({ control: form.control, name: "isActive" });

  useEffect(() => {
    if (settings.data?.settings) form.reset(settings.data.settings);
  }, [form, settings.data]);

  const confirmActiveChange = async () => {
    if (activeChange == null) return;

    try {
      const response = await update.mutateAsync({
        ...form.getValues(),
        isActive: activeChange,
      } as ReferralSettings);
      form.reset(response.settings);
      notify(activeChange ? "سیستم ریفرال فعال شد." : "سیستم ریفرال غیرفعال شد.");
      setActiveChange(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : "تغییر وضعیت ناموفق بود.", "error");
    }
  };

  return (
    <>
      <section className="grid gap-5 rounded-[20px] border border-[#e3e9e3] bg-white p-6">
        <div>
          <h2 className="m-0 flex items-center gap-2 text-[13px] font-extrabold text-[#19312f]">
            <Gift size={18} /> سیستم ریفرال
          </h2>
          <p className="mb-0 mt-2 text-[10px] leading-6 text-[#7c8b88]">
            فعال‌بودن ثبت دعوت‌های جدید را از اینجا کنترل کن. مقادیر پاداش ریفرال در تب رادیکوین نگهداری می‌شوند.
          </p>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#e3e9e3] bg-[#fbfcfa] p-4 text-[11px] font-normal text-[#304943]">
          فعال‌سازی سیستم ریفرال
          <Checkbox checked={isActive} onChange={(event) => setActiveChange(event.target.checked)} />
        </label>
      </section>
      {activeChange != null && (
        <ConfirmActionModal
          title="تأیید تغییر وضعیت ریفرال"
          description={
            activeChange
              ? "سیستم ریفرال فعال شود؟ دعوت‌های تأییدشده مطابق قوانین رادیکوین پاداش می‌گیرند."
              : "سیستم ریفرال غیرفعال شود؟ لینک‌ها همچنان باز می‌شوند اما دعوت جدیدی ثبت نخواهد شد."
          }
          confirmLabel={activeChange ? "بله، فعال شود" : "بله، غیرفعال شود"}
          pending={update.isPending}
          tone={activeChange ? "primary" : "danger"}
          onCancel={() => setActiveChange(null)}
          onConfirm={() => void confirmActiveChange()}
        />
      )}
    </>
  );
}
