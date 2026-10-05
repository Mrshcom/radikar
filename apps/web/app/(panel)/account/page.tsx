"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authQueryKey, useAuth, type CurrentUser } from "@/app/_components/auth";
import { useToast } from "@/app/_components/toast";
import { apiRequest } from "@/lib/api-client";
import { useMembership } from "@/lib/billing";
import { MembershipSummary } from "../_components/membership-summary";
import { MembershipSummarySkeleton } from "../_components/skeletons";
import { TextField } from "@/app/_components/text-field";
import { FormField } from "../_components/form-field";
import { SectionTitle } from "../_components/ui";

const schema = z.object({
  fullName: z.string().trim().min(2, "نام باید حداقل دو حرف باشد.").max(100),
});
type Values = z.infer<typeof schema>;
const knowledgeBaseControlClass =
  "h-[42px] min-h-[42px] bg-[#fbfcfa] text-[12px] text-[#19312f] focus:border-[#79b8a5] focus:ring-3 focus:ring-[#e5f2ed]";

export default function AccountPage() {
  const { user } = useAuth();
  const membership = useMembership();
  const queryClient = useQueryClient();
  const notify = useToast();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { fullName: "" } });
  const loginIdentifier = user?.phone || user?.email || "";
  const loginMethod = user?.phone ? "شماره همراه" : "ایمیل Google";

  useEffect(() => form.reset({ fullName: user?.fullName ?? "" }), [form, user?.fullName]);

  const update = useMutation({
    mutationFn: (input: Values) =>
      apiRequest<{ user: CurrentUser }>("/api/account", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: async () => {
      notify("اطلاعات فردی با موفقیت ذخیره شد.");
      await queryClient.invalidateQueries({ queryKey: authQueryKey });
    },
    onError: (error) => notify(error instanceof Error ? error.message : "ذخیره اطلاعات فردی ناموفق بود.", "error"),
  });

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6">
      <SectionTitle
        className="max-w-5xl"
        description="وضعیت عضویت، زمان و اعتبار باقی‌مانده را یکجا ببین."
        title="اطلاعات حساب و میزان مصرف"
      />

      {membership.isPending && <MembershipSummarySkeleton />}
      {membership.isError && (
        <div className="rounded-[18px] border border-[#f0d7d0] bg-[#fff7f4] p-5 text-[10px] text-[#a44d3e]">
          دریافت وضعیت پلن ممکن نشد. کمی بعد دوباره تلاش کن.
        </div>
      )}
      {membership.data && <MembershipSummary membership={membership.data} showUpgradeAction />}

      <form
        className="grid gap-5 rounded-[20px] border border-[#e3e9e3] bg-white p-6"
        onSubmit={form.handleSubmit((values) => update.mutate(values))}
      >
        <h2 className="m-0 text-[16px] font-black text-[#263d38]">اطلاعات فردی</h2>
        <div className="grid items-start gap-5 md:grid-cols-2">
          <FormField
            className="gap-1.5 text-[10px] font-normal text-[#19312f]"
            error={form.formState.errors.fullName?.message}
            label="نام و نام خانوادگی"
            required
          >
            <TextField
              aria-invalid={Boolean(form.formState.errors.fullName)}
              className={`${knowledgeBaseControlClass} text-right`}
              {...form.register("fullName")}
            />
          </FormField>
          <FormField
            className="gap-1.5 text-[10px] font-normal text-[#19312f]"
            hint="این شناسه از روش ورود تأییدشده حساب گرفته شده و در این بخش قابل تغییر نیست."
            label={loginMethod}
          >
            <TextField
              className={`${knowledgeBaseControlClass} text-left`}
              dir="ltr"
              readOnly
              value={loginIdentifier}
            />
          </FormField>
        </div>
        <button
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[11px] border-0 bg-[#0f7b62] px-5 text-[11px] font-bold text-white disabled:opacity-40"
          disabled={update.isPending}
          type="submit"
        >
          {update.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />} ذخیره تغییرات
        </button>
      </form>
    </div>
  );
}
