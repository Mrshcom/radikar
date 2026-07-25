"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, Bell, BriefcaseBusiness, CheckCircle2, ChevronLeft, FileText, LayoutDashboard, MessageSquareText, Search, Settings, Sparkles, Target } from "lucide-react";
import { jobStore, resumeStore, userProfileStore } from "@/lib/data/stores";
import type { JobRecord, UserProfileRecord } from "@/lib/data/models";
import { Modal } from "./ui";

const menuItems = [
  { href: "/dashboard", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/resumes", label: "رزومه‌های من", icon: FileText },
  { href: "/match", label: "تطبیق با شغل", icon: Target },
  { href: "/jobs", label: "فرصت‌های شغلی", icon: BriefcaseBusiness },
  { href: "/applications", label: "پیگیری اپلای‌ها", icon: BarChart3 },
  { href: "/interview", label: "آمادگی مصاحبه", icon: MessageSquareText },
];

const emptyProfile: Omit<UserProfileRecord, "id" | "createdAt" | "updatedAt"> = {
  fullName: "",
  targetTitle: "",
  workMode: "",
};

const workModeLabels: Record<UserProfileRecord["workMode"], string> = {
  "": "نوع همکاری انتخاب نشده",
  remote: "دورکاری",
  hybrid: "هیبرید",
  onsite: "حضوری",
};

const ToastContext = createContext<(message: string) => void>(() => undefined);
export const useToast = () => useContext(ToastContext);

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => Array.from(part)[0]).join("") : "—";
}

export function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [dialog, setDialog] = useState<"search" | "settings" | null>(null);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [resumeName, setResumeName] = useState("");
  const title = useMemo(() => menuItems.find((item) => item.href === pathname)?.label ?? "نمای کلی", [pathname]);
  const notify = useCallback((message: string) => setToast(message), []);
  const displayName = profile?.fullName.trim() || resumeName.trim();
  const latestJob = jobs[0];

  useEffect(() => {
    let active = true;
    Promise.all([userProfileStore.get("current-user"), jobStore.list(), resumeStore.list()])
      .then(([storedProfile, storedJobs, resumes]) => {
        if (!active) return;
        setProfile(storedProfile ?? null);
        setJobs(storedJobs);
        setResumeName(resumes[0]?.data.fullName ?? "");
      })
      .catch(() => {
        if (active) notify("دریافت اطلاعات پنل ناموفق بود.");
      });
    return () => { active = false; };
  }, [notify]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setDialog("search");
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  const openSettings = () => {
    setProfileForm(profile
      ? { fullName: profile.fullName, targetTitle: profile.targetTitle, workMode: profile.workMode }
      : { ...emptyProfile, fullName: resumeName });
    setDialog("settings");
  };

  const saveProfile = async () => {
    const now = new Date().toISOString();
    const record: UserProfileRecord = {
      id: "current-user",
      ...profileForm,
      fullName: profileForm.fullName.trim(),
      targetTitle: profileForm.targetTitle.trim(),
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await userProfileStore.put(record);
      setProfile(record);
      setDialog(null);
      notify("تنظیمات پروفایل ذخیره شد.");
    } catch {
      notify("ذخیره تنظیمات پروفایل ناموفق بود.");
    }
  };

  return <ToastContext.Provider value={notify}><div className="app-shell" dir="rtl">
    <aside className="sidebar">
      <Link className="brand" href="/dashboard"><span className="radicar-mark"><Image src="/logo.svg" width={24} height={24} alt="" priority /></span><div><strong>رادیکار</strong><small>همراه حرفه‌ای تو کار</small></div></Link>
      <nav aria-label="منوی اصلی"><span className="nav-caption">فضای کاری</span>{menuItems.map((item) => { const Icon = item.icon; return <Link key={item.href} className={pathname === item.href ? "active" : ""} href={item.href}><Icon size={19} /><span>{item.label}</span>{item.href === "/jobs" && jobs.length > 0 && <em>{jobs.length.toLocaleString("fa-IR")}</em>}</Link>; })}</nav>
      <div className="sidebar-user"><div className="avatar">{initials(displayName)}</div><div><strong>{displayName || "پروفایل تکمیل نشده"}</strong><span>{profile?.targetTitle || workModeLabels[profile?.workMode ?? ""]}</span></div><button aria-label="تنظیمات" onClick={openSettings}><Settings size={18} /></button></div>
    </aside>
    <main><header className="topbar"><div className="mobile-brand"><span className="radicar-mark"><Image src="/logo.svg" width={21} height={21} alt="" /></span><strong>رادیکار</strong></div><span className="current-page">{title}</span><div className="topbar-actions"><button className="search-button" onClick={() => setDialog("search")}><Search size={18} /><span>جست‌وجو...</span><kbd>⌘ K</kbd></button><button className="notification-button" onClick={() => setNoticeOpen((value) => !value)} aria-label="اعلان‌ها"><Bell size={19} />{latestJob && <i />}</button>{noticeOpen && <div className="notice-popover">{latestJob ? <><strong>{latestJob.role}</strong><p>{latestJob.company}{latestJob.match > 0 ? ` · تطابق ${latestJob.match.toLocaleString("fa-IR")}٪` : ""}</p><Link href="/jobs" onClick={() => setNoticeOpen(false)}>مشاهده فرصت</Link></> : <><strong>اعلان تازه‌ای نیست</strong><p>فرصت‌های واردشده و رویدادهای واقعی اینجا نمایش داده می‌شوند.</p></>}</div>}</div></header><div className="content">{children}</div></main>
    <nav className="mobile-nav" aria-label="منوی موبایل">{menuItems.slice(0, 5).map((item) => { const Icon = item.icon; return <Link key={item.href} className={pathname === item.href ? "active" : ""} href={item.href}><Icon size={19} /><span>{item.label.split(" ")[0]}</span></Link>; })}</nav>
    {toast && <div className="toast" role="status"><CheckCircle2 size={19} />{toast}</div>}
    {dialog === "search" && <Modal title="جست‌وجوی سریع" description="مستقیم به هر بخش یا اقدام برو." onClose={() => setDialog(null)}><div className="command-search"><div><Search size={18} /><input autoFocus placeholder="مثلاً رزومه، فرصت شغلی یا مصاحبه..." /></div>{menuItems.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setDialog(null)}><Icon size={18} /><span>{item.label}</span><ChevronLeft size={16} /></Link>; })}</div></Modal>}
    {dialog === "settings" && <Modal title="تنظیمات پروفایل" description="این اطلاعات فعلاً در مرورگر ذخیره می‌شوند و بعداً از سرویس حساب کاربری می‌آیند." onClose={() => setDialog(null)}><div className="form-stack"><label>نام و نام خانوادگی<input value={profileForm.fullName} onChange={(event) => setProfileForm((value) => ({ ...value, fullName: event.target.value }))} /></label><label>عنوان هدف<input value={profileForm.targetTitle} onChange={(event) => setProfileForm((value) => ({ ...value, targetTitle: event.target.value }))} /></label><label>نوع همکاری<select value={profileForm.workMode} onChange={(event) => setProfileForm((value) => ({ ...value, workMode: event.target.value as UserProfileRecord["workMode"] }))}><option value="">انتخاب کنید</option><option value="hybrid">هیبرید</option><option value="remote">دورکاری</option><option value="onsite">حضوری</option></select></label><div className="modal-actions"><button className="secondary-btn" onClick={() => setDialog(null)}>انصراف</button><button className="primary-btn" onClick={() => void saveProfile()}>ذخیره تنظیمات</button></div></div></Modal>}
  </div></ToastContext.Provider>;
}
