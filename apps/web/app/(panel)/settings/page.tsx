"use client";

import { LogOut, Settings, ShieldCheck } from "lucide-react";
import { useAuth, useLogout } from "@/app/_components/auth";

export default function SettingsPage() {
  const { user } = useAuth();
  const logout = useLogout();
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <header><span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><Settings size={18} /> تنظیمات</span><h1 className="mb-0 mt-3 text-[26px] font-black">امنیت و ورود</h1></header>
      <section className="grid gap-5 rounded-[20px] border border-[#e3e9e3] bg-white p-6">
        <div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#eaf5f0] text-[#0f7b62]"><ShieldCheck size={20} /></span><div><strong className="text-[12px]">ورود با شماره همراه</strong><p className="mb-0 mt-2 text-[10px] leading-7 text-[#7c8b88]">ورود حساب با کد یک‌بارمصرف شماره <span dir="ltr">{user?.phone}</span> انجام می‌شود.</p></div></div>
        <div className="border-t border-[#edf0ec] pt-5"><button className="inline-flex min-h-11 items-center gap-2 rounded-[11px] border border-[#efc9c5] bg-[#fff7f5] px-4 text-[10px] font-bold text-[#a13f37]" onClick={() => void logout()} type="button"><LogOut size={16} /> خروج از حساب روی این دستگاه</button></div>
      </section>
    </div>
  );
}
