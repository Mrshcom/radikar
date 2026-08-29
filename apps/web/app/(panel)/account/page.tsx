"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, UserRound } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authQueryKey, useAuth, type CurrentUser } from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";

const schema = z.object({ fullName: z.string().trim().min(2, "نام باید حداقل دو حرف باشد.").max(100) });
type Values = z.infer<typeof schema>;

export default function AccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { fullName: "" } });
  useEffect(() => form.reset({ fullName: user?.fullName ?? "" }), [form, user?.fullName]);
  const update = useMutation({
    mutationFn: (input: Values) => apiRequest<{ user: CurrentUser }>("/api/account", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: authQueryKey }),
  });
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <header><span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><UserRound size={18} /> حساب کاربری</span><h1 className="mb-0 mt-3 text-[26px] font-black">اطلاعات حساب</h1></header>
      <form className="grid gap-5 rounded-[20px] border border-[#e3e9e3] bg-white p-6" onSubmit={form.handleSubmit((values) => update.mutate(values))}>
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
