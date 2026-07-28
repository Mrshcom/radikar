"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, Bell, BookOpenText, BriefcaseBusiness, Check, CheckCircle2, ChevronLeft, FileText, LayoutDashboard, MessageSquareText, Plus, Search, Settings, Target } from "lucide-react";
import { appProfileStore, createRecordId, ensureDefaultAppProfile, getActiveProfileId, jobStore, resumeStore, setActiveProfileId, userProfileStore } from "@/lib/data/stores";
import type { AppProfileRecord, JobRecord, UserProfileRecord } from "@/lib/data/models";
import { Modal } from "./ui";
import { useFieldDirectionManager } from "@/lib/field-direction";

const menuItems = [
  { href: "/dashboard", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/knowledge-base", label: "پایگاه دانش", icon: BookOpenText },
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
  useFieldDirectionManager();
  const pathname = usePathname();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [dialog, setDialog] = useState<"search" | "settings" | "profiles" | null>(null);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [profiles, setProfiles] = useState<AppProfileRecord[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState("");
  const [addingProfile, setAddingProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({ fullName: "", targetTitle: "" });
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [resumeName, setResumeName] = useState("");
  const title = useMemo(() => menuItems.find((item) => item.href === pathname)?.label ?? "نمای کلی", [pathname]);
  const notify = useCallback((message: string) => setToast(message), []);
  const displayName = profile?.fullName.trim() || resumeName.trim();
  const latestJob = jobs[0];

  useEffect(() => {
    let active = true;
    Promise.all([ensureDefaultAppProfile(), getActiveProfileId()])
      .then(async ([storedProfiles, profileId]) => {
        const [storedProfile, storedJobs, resumes] = await Promise.all([userProfileStore.get(profileId), jobStore.list(), resumeStore.list()]);
        return { storedProfiles, profileId, storedProfile, storedJobs, resumes };
      })
      .then(({ storedProfiles, profileId, storedProfile, storedJobs, resumes }) => {
        if (!active) return;
        setProfiles(storedProfiles);
        setActiveProfileIdState(profileId);
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
      id: activeProfileId,
      ...profileForm,
      fullName: profileForm.fullName.trim(),
      targetTitle: profileForm.targetTitle.trim(),
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await userProfileStore.put(record);
      const appProfile = profiles.find((item) => item.id === activeProfileId);
      if (appProfile) {
        const updatedAppProfile = { ...appProfile, fullName: record.fullName || appProfile.fullName, targetTitle: record.targetTitle, updatedAt: now };
        await appProfileStore.put(updatedAppProfile);
        setProfiles((items) => items.map((item) => item.id === updatedAppProfile.id ? updatedAppProfile : item));
      }
      setProfile(record);
      setDialog(null);
      notify("تنظیمات پروفایل ذخیره شد.");
    } catch {
      notify("ذخیره تنظیمات پروفایل ناموفق بود.");
    }
  };

  const switchProfile = async (profileId: string) => {
    if (profileId === activeProfileId) {
      setDialog(null);
      return;
    }
    await setActiveProfileId(profileId);
    window.location.reload();
  };

  const addProfile = async () => {
    const fullName = newProfile.fullName.trim();
    if (!fullName) {
      notify("نام پروفایل را وارد کن.");
      return;
    }
    const now = new Date().toISOString();
    const id = createRecordId("profile");
    const appProfile: AppProfileRecord = {
      id,
      fullName,
      targetTitle: newProfile.targetTitle.trim(),
      createdAt: now,
      updatedAt: now,
    };
    try {
      await appProfileStore.put(appProfile);
      await setActiveProfileId(id);
      await userProfileStore.put({
        id,
        fullName: appProfile.fullName,
        targetTitle: appProfile.targetTitle,
        workMode: "",
        createdAt: now,
        updatedAt: now,
      });
      window.location.reload();
    } catch {
      await setActiveProfileId(activeProfileId);
      notify("ساخت پروفایل جدید ناموفق بود.");
    }
  };

  return <ToastContext.Provider value={notify}><div className="app-shell" dir="rtl">
    <aside className="sidebar">
      <Link className="brand" href="/dashboard"><span className="radicar-mark"><Image src="/logo.svg" width={24} height={24} alt="" priority /></span><div><strong>رادیکار</strong><small>همراه حرفه‌ای تو کار</small></div></Link>
      <nav aria-label="منوی اصلی"><span className="nav-caption">فضای کاری</span>{menuItems.map((item) => { const Icon = item.icon; return <Link key={item.href} className={pathname === item.href ? "active" : ""} href={item.href}><Icon size={19} /><span>{item.label}</span>{item.href === "/jobs" && jobs.length > 0 && <em>{jobs.length.toLocaleString("fa-IR")}</em>}</Link>; })}</nav>
      <div className="sidebar-user"><button className="sidebar-profile-trigger" onClick={() => setDialog("profiles")}><span className="avatar">{initials(displayName)}</span><span><strong>{displayName || "پروفایل تکمیل نشده"}</strong><small>{profile?.targetTitle || workModeLabels[profile?.workMode ?? ""]}</small></span><ChevronLeft size={15} /></button><button aria-label="تنظیمات" onClick={openSettings}><Settings size={18} /></button></div>
    </aside>
    <main><header className="topbar"><div className="mobile-brand"><span className="radicar-mark"><Image src="/logo.svg" width={21} height={21} alt="" /></span><strong>رادیکار</strong></div><span className="current-page">{title}</span><div className="topbar-actions"><button className="search-button" onClick={() => setDialog("search")}><Search size={18} /><span>جست‌وجو...</span><kbd>⌘ K</kbd></button><button className="notification-button" onClick={() => setNoticeOpen((value) => !value)} aria-label="اعلان‌ها"><Bell size={19} />{latestJob && <i />}</button>{noticeOpen && <div className="notice-popover">{latestJob ? <><strong>{latestJob.role}</strong><p>{latestJob.company}{latestJob.match > 0 ? ` · تطابق ${latestJob.match.toLocaleString("fa-IR")}٪` : ""}</p><Link href="/jobs" onClick={() => setNoticeOpen(false)}>مشاهده فرصت</Link></> : <><strong>اعلان تازه‌ای نیست</strong><p>فرصت‌های واردشده و رویدادهای واقعی اینجا نمایش داده می‌شوند.</p></>}</div>}</div></header><div className="content">{children}</div></main>
    <nav className="mobile-nav" aria-label="منوی موبایل">{menuItems.slice(0, 5).map((item) => { const Icon = item.icon; return <Link key={item.href} className={pathname === item.href ? "active" : ""} href={item.href}><Icon size={19} /><span>{item.label.split(" ")[0]}</span></Link>; })}</nav>
    {toast && <div className="toast" role="status"><CheckCircle2 size={19} />{toast}</div>}
    {dialog === "search" && <Modal title="جست‌وجوی سریع" description="مستقیم به هر بخش یا اقدام برو." onClose={() => setDialog(null)}><div className="command-search"><div><Search size={18} /><input autoFocus placeholder="مثلاً رزومه، فرصت شغلی یا مصاحبه..." /></div>{menuItems.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setDialog(null)}><Icon size={18} /><span>{item.label}</span><ChevronLeft size={16} /></Link>; })}</div></Modal>}
    {dialog === "profiles" && <Modal title="فضاهای کاری" description="هر پروفایل رزومه‌ها، فرصت‌ها، اپلای‌ها و جلسه‌های مستقل خودش را دارد." onClose={() => setDialog(null)}><div className="profile-switcher">{profiles.map((item) => <button key={item.id} className={item.id === activeProfileId ? "active" : ""} onClick={() => void switchProfile(item.id)}><span className="avatar">{initials(item.fullName)}</span><span><strong>{item.fullName}</strong><small>{item.targetTitle || "تخصص ثبت نشده"}</small></span>{item.id === activeProfileId ? <Check size={18} /> : <ChevronLeft size={16} />}</button>)}{addingProfile ? <div className="new-profile-form"><label>نام و نام خانوادگی<input autoFocus value={newProfile.fullName} onChange={(event) => setNewProfile((value) => ({ ...value, fullName: event.target.value }))} /></label><label>عنوان یا تخصص<input value={newProfile.targetTitle} onChange={(event) => setNewProfile((value) => ({ ...value, targetTitle: event.target.value }))} /></label><div className="modal-actions"><button className="secondary-btn" onClick={() => setAddingProfile(false)}>انصراف</button><button className="primary-btn" onClick={() => void addProfile()}>ساخت و ورود به فضا</button></div></div> : <button className="add-profile-button" onClick={() => setAddingProfile(true)}><Plus size={18} /><span><strong>افزودن پروفایل جدید</strong><small>ساخت یک فضای کاری مستقل برای شخص دیگر</small></span></button>}</div></Modal>}
    {dialog === "settings" && <Modal title="تنظیمات پروفایل" description="این اطلاعات فعلاً در مرورگر ذخیره می‌شوند و بعداً از سرویس حساب کاربری می‌آیند." onClose={() => setDialog(null)}><div className="form-stack"><label>نام و نام خانوادگی<input value={profileForm.fullName} onChange={(event) => setProfileForm((value) => ({ ...value, fullName: event.target.value }))} /></label><label>عنوان هدف<input value={profileForm.targetTitle} onChange={(event) => setProfileForm((value) => ({ ...value, targetTitle: event.target.value }))} /></label><label>نوع همکاری<select value={profileForm.workMode} onChange={(event) => setProfileForm((value) => ({ ...value, workMode: event.target.value as UserProfileRecord["workMode"] }))}><option value="">انتخاب کنید</option><option value="hybrid">هیبرید</option><option value="remote">دورکاری</option><option value="onsite">حضوری</option></select></label><div className="modal-actions"><button className="secondary-btn" onClick={() => setDialog(null)}>انصراف</button><button className="primary-btn" onClick={() => void saveProfile()}>ذخیره تنظیمات</button></div></div></Modal>}
  </div></ToastContext.Provider>;
}
