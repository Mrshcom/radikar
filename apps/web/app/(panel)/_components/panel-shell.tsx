"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BarChart3,
  Bell,
  BookOpenText,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleAlert,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
  WandSparkles,
  ShieldCheck,
  LogOut,
  CreditCard,
  Database,
  ReceiptText,
  Settings,
  UserRound,
  UserPlus,
  Users,
  X,
  ShoppingBag,
  FilePlus2,
  Activity,
  Bot,
} from "lucide-react";
import {
  appProfileStore,
  createRecordId,
  ensureDefaultAppProfile,
  getActiveProfileId,
  jobStore,
  removeWorkspace,
  setActiveProfileId,
} from "@/lib/data/stores";
import type { AppProfileRecord, JobRecord } from "@/lib/data/models";
import { DeleteConfirmModal, Modal } from "./ui";
import { useFieldDirectionManager } from "@/lib/field-direction";
import { cn } from "@/lib/cn";
import {
  ModelTaskProvider,
  useModelTasks,
} from "./model-task-provider";
import { useAuth, useLogout, type UserRole } from "@/app/_components/auth";
import { useToast } from "@/app/_components/toast";
import { useAdminEvents, type AdminEvent } from "@/lib/admin-stats";

type MenuItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: readonly UserRole[];
};

const menuItems: MenuItem[] = [
  { href: "/dashboard", label: "نمای کلی", icon: LayoutDashboard, roles: ["user"] },
  { href: "/knowledge-base", label: "پایگاه دانش", icon: BookOpenText, roles: ["user"] },
  { href: "/resumes", label: "رزومه‌های من", icon: FileText, roles: ["user"] },
  { href: "/match", label: "تطبیق با شغل", icon: Target, roles: ["user"] },
  { href: "/jobs", label: "فرصت‌های شغلی", icon: BriefcaseBusiness, roles: ["user"] },
  { href: "/applications", label: "پیگیری اپلای‌ها", icon: BarChart3, roles: ["user"] },
  { href: "/interview", label: "آمادگی مصاحبه", icon: MessageSquareText, roles: ["user"] },
  { href: "/admin", label: "داشبورد مدیریتی", icon: LayoutDashboard, roles: ["admin", "superadmin"] },
  { href: "/admin/users", label: "کاربران و دسترسی‌ها", icon: Users, roles: ["superadmin"] },
  { href: "/admin/memberships", label: "عضویت و اعتبار", icon: ShieldCheck, roles: ["admin", "superadmin"] },
  { href: "/admin/orders", label: "سفارش‌های سامانه", icon: ReceiptText, roles: ["admin", "superadmin"] },
  { href: "/admin/payments", label: "تراکنش‌ها و واریزی‌ها", icon: CreditCard, roles: ["admin", "superadmin"] },
  { href: "/admin/records", label: "داده‌های سامانه", icon: Database, roles: ["superadmin"] },
  { href: "/admin/model-usage", label: "مصرف و هزینه مدل‌ها", icon: Bot, roles: ["superadmin"] },
];

const pageTitles: Record<string, string> = {
  "/account": "حساب کاربری",
  "/settings": "تنظیمات",
  "/orders": "سفارش‌ها",
  "/upgrade": "خرید و ارتقای بسته",
  "/billing/result": "نتیجه پرداخت",
  "/admin/memberships": "کاربران و عضویت‌ها",
  "/admin/users": "کاربران و دسترسی‌ها",
  "/admin/orders": "سفارش‌های سامانه",
  "/admin/payments": "واریزی‌های سامانه",
  "/admin/records": "داده‌های سامانه",
  "/admin/model-usage": "مصرف و هزینه مدل‌ها",
};

const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border-0 bg-[#0f7b62] px-[15px] text-[11px] font-bold text-white no-underline shadow-[0_7px_17px_rgba(15,123,98,.17)] disabled:cursor-not-allowed disabled:opacity-45";
const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[#e1e6e0] bg-white px-[15px] text-[11px] font-bold text-[#526461]";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length
    ? parts
        .slice(0, 2)
        .map((part) => Array.from(part)[0])
        .join("\u200c")
    : "—";
}

function adminEventHref(type: AdminEvent["type"]) {
  if (type === "purchase") return "/admin/orders";
  if (type === "resume") return "/admin/records";
  return "/admin/users";
}

function adminEventMessage(event: AdminEvent) {
  const userName = event.user.fullName || event.user.phone;
  if (event.type === "signup") return `${userName} در سامانه ثبت‌نام کرد.`;
  if (event.type === "login") return `${userName} وارد سامانه شد.`;
  if (event.type === "resume") return `${userName} یک رزومه جدید ساخت.`;
  const amountTomans = Math.round((event.details.amountRials ?? 0) / 10).toLocaleString("fa-IR");
  return `${userName} بسته ${event.details.planName || "اشتراک"} را به مبلغ ${amountTomans} تومان خرید.`;
}

function adminEventTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toLocaleDateString("fa-IR") === today.toLocaleDateString("fa-IR");
  return sameDay
    ? `امروز، ${date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`
    : date.toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" });
}

export function PanelShell({ children }: { children: ReactNode }) {
  return (
    <ModelTaskProvider>
      <PanelShellContent>{children}</PanelShellContent>
    </ModelTaskProvider>
  );
}

function PanelShellContent({ children }: { children: ReactNode }) {
  useFieldDirectionManager();
  const pathname = usePathname();
  const { user } = useAuth();
  const logout = useLogout();
  const { tasks: modelTasks, openTask, cancelTask } = useModelTasks();
  const notify = useToast();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<"search" | "profiles" | null>(null);
  const [profiles, setProfiles] = useState<AppProfileRecord[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState("");
  const [addingProfile, setAddingProfile] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editingWorkspaceId, setEditingWorkspaceId] = useState("");
  const [editingWorkspaceName, setEditingWorkspaceName] = useState("");
  const [pendingWorkspaceDelete, setPendingWorkspaceDelete] =
    useState<AppProfileRecord | null>(null);
  const [armedWorkspaceDeleteId, setArmedWorkspaceDeleteId] = useState("");
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const noticeRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userRole = user?.role;
  const isManagement = userRole === "admin" || userRole === "superadmin";
  const isSuperadmin = userRole === "superadmin";
  const adminEvents = useAdminEvents(isSuperadmin);
  const [seenAdminEventIds, setSeenAdminEventIds] = useState<Set<string>>(() => new Set());
  const visibleMenuItems = useMemo(
    () => menuItems.filter((item) => userRole && item.roles.includes(userRole)),
    [userRole],
  );
  const title = useMemo(
    () =>
      pageTitles[pathname] ??
      visibleMenuItems.find((item) => item.href === pathname)?.label ??
      "نمای کلی",
    [pathname, visibleMenuItems],
  );
  const latestJob = jobs[0];
  const activeWorkspace = profiles.find((item) => item.id === activeProfileId);
  const unreadAdminEvents = (adminEvents.data?.items ?? []).filter(
    (event) => !seenAdminEventIds.has(event.id),
  );

  useEffect(() => {
    if (userRole !== "user") return;
    let active = true;
    Promise.all([ensureDefaultAppProfile(), getActiveProfileId()])
      .then(async ([storedProfiles, profileId]) => {
        const storedJobs = await jobStore.list();
        return { storedProfiles, profileId, storedJobs };
      })
      .then(({ storedProfiles, profileId, storedJobs }) => {
        if (!active) return;
        setProfiles(storedProfiles);
        setActiveProfileIdState(profileId);
        setJobs(storedJobs);
      })
      .catch(() => {
        if (active) notify("دریافت اطلاعات پنل ناموفق بود.", "error");
      });
    return () => {
      active = false;
    };
  }, [notify, userRole]);

  useEffect(() => {
    if (!noticeOpen) return;
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      if (!noticeRef.current?.contains(event.target as Node))
        setNoticeOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNoticeOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideInteraction);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideInteraction);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [noticeOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const close = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (isManagement) return;
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setDialog("search");
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, [isManagement]);

  const saveWorkspaceName = async () => {
    const workspaceName = editingWorkspaceName.trim();
    if (!workspaceName) {
      notify("نام فضای کاری را وارد کن.", "error");
      return;
    }
    const workspace = profiles.find((item) => item.id === editingWorkspaceId);
    if (!workspace) return;
    const now = new Date().toISOString();
    try {
      const updatedWorkspace = { ...workspace, workspaceName, updatedAt: now };
      await appProfileStore.put(updatedWorkspace);
      setProfiles((items) =>
        items.map((item) =>
          item.id === workspace.id ? updatedWorkspace : item,
        ),
      );
      setEditingWorkspaceId("");
      setEditingWorkspaceName("");
      notify("نام فضای کاری تغییر کرد.");
    } catch {
      notify("ویرایش نام فضای کاری ناموفق بود.", "error");
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
    const workspaceName = newWorkspaceName.trim();
    if (!workspaceName) {
      notify("نام فضای کاری را وارد کن.", "error");
      return;
    }
    const now = new Date().toISOString();
    const id = createRecordId("profile");
    const appProfile: AppProfileRecord = {
      id,
      workspaceName,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await appProfileStore.put(appProfile);
      await setActiveProfileId(id);
      window.location.reload();
    } catch {
      await setActiveProfileId(activeProfileId);
      notify("ساخت فضای کاری جدید ناموفق بود.", "error");
    }
  };

  const confirmWorkspaceDelete = async () => {
    const workspace = pendingWorkspaceDelete;
    if (!workspace) return;
    if (armedWorkspaceDeleteId !== workspace.id) {
      setArmedWorkspaceDeleteId(workspace.id);
      notify("برای حذف فضای کاری، دکمه تأیید را یک‌بار دیگر بزن.", "info");
      return;
    }
    try {
      await removeWorkspace(workspace.id);
      const remaining = profiles.filter((item) => item.id !== workspace.id);
      setPendingWorkspaceDelete(null);
      setArmedWorkspaceDeleteId("");
      if (workspace.id === activeProfileId) {
        if (remaining[0]) await setActiveProfileId(remaining[0].id);
        else await ensureDefaultAppProfile();
        window.location.reload();
        return;
      }
      setProfiles(remaining);
      notify("فضای کاری و اطلاعات داخل آن حذف شد.");
    } catch {
      notify("حذف فضای کاری ناموفق بود.", "error");
    }
  };

  return (
    <div
        className="min-h-screen print:hidden [&_a]:cursor-pointer [&_a]:transition-opacity [&_a:hover]:opacity-80 [&_button:not(:disabled)]:cursor-pointer [&_button:not(:disabled)]:transition-[opacity,filter,background-color,border-color,color,box-shadow] [&_button:not(:disabled):hover]:opacity-80 [&_button:disabled]:cursor-not-allowed [&_input[type=checkbox]]:cursor-pointer [&_input[type=radio]]:cursor-pointer [&_input[type=range]]:cursor-pointer [&_select]:cursor-pointer [&_select]:transition-colors [&_select:hover]:border-[#9ccbbb] [&_summary]:cursor-pointer [&_summary]:transition-opacity [&_summary:hover]:opacity-80"
        dir="rtl"
      >
        <aside className="fixed inset-y-0 start-0 z-20 flex w-[248px] flex-col border-e border-[#e7ebe6] bg-white px-4 pb-[18px] pt-6 max-[820px]:hidden">
          <Link
            className="flex items-center gap-[11px] border-0 bg-transparent px-[9px] pb-6 text-right text-[#19312f] no-underline"
            href={isManagement ? "/admin" : "/dashboard"}
          >
            <span className="grid size-[39px] place-items-center rounded-[13px_13px_13px_5px] border border-[#cfe9df] bg-[#ecf8f3] shadow-[0_8px_18px_rgba(18,60,55,.16)]">
              <Image
                className="block size-6"
                src="/logo.svg"
                width={24}
                height={24}
                alt=""
                priority
              />
            </span>
            <div className="flex flex-col">
              <strong className="text-[19px] tracking-[-.5px]">رادیکار</strong>
              <small className="mt-0.5 text-[10px] text-[#93a09d]">
                همراه حرفه‌ای تو کار
              </small>
            </div>
          </Link>
          <nav
            className="flex min-h-0 flex-1 flex-col gap-[5px] overflow-y-auto"
            aria-label="منوی اصلی"
          >
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  className={cn(
                    "relative flex min-h-[43px] items-center gap-3 rounded-[11px] border-0 px-[13px] text-right text-[13px] no-underline transition-colors hover:bg-[#f5f8f5] hover:text-[#19312f]",
                    active
                      ? "bg-[#e6f4ee] font-bold text-[#0c7058] after:absolute after:-right-4 after:h-[21px] after:w-[3px] after:rounded-l-sm after:bg-[#0f7b62] after:content-['']"
                      : "bg-transparent text-[#697a77]",
                  )}
                  href={item.href}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                  {item.href === "/jobs" && jobs.length > 0 && (
                    <em
                      className={cn(
                        "mr-auto grid h-[21px] min-w-[23px] place-items-center rounded-[7px] text-[10px] not-italic transition-colors",
                        active
                          ? "bg-[#0f7b62] text-white"
                          : "bg-[#eff1ee] text-[#61716e]",
                      )}
                    >
                      {jobs.length.toLocaleString("fa-IR")}
                    </em>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto grid w-full min-w-0 gap-3">
            {!isManagement && modelTasks.length > 0 && (
              <section
                aria-label="فعالیت‌های مدل"
                aria-live="polite"
                className="grid max-h-[210px] gap-1.5 overflow-y-auto rounded-[14px] border border-[#d7e8e1] bg-[#f5faf7] p-2 shadow-[0_10px_28px_rgba(24,73,60,.09)]"
              >
                <div className="flex items-center gap-1.5 px-1 pb-0.5 text-[#1b5145]">
                  <WandSparkles size={14} />
                  <strong className="text-[9px]">فعالیت‌های مدل</strong>
                </div>
                {modelTasks.map((task) => (
                  <div
                    className={cn(
                      "flex min-w-0 cursor-pointer items-center gap-2 rounded-[10px] border p-2 text-right",
                      task.status === "running"
                        ? "border-[#c9e3d9] bg-white text-[#176b57]"
                        : task.status === "completed"
                          ? "border-[#cce4d9] bg-[#e9f6f0] text-[#12664f]"
                          : task.status === "canceled"
                            ? "border-[#e3e6e4] bg-[#f5f6f5] text-[#74827e]"
                            : "border-[#efd9b2] bg-[#fff7e8] text-[#966925]",
                    )}
                    key={task.id}
                    onClick={() => openTask(task)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      openTask(task);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-current/10">
                      {task.status === "running" ? (
                        <LoaderCircle className="animate-spin" size={14} />
                      ) : task.status === "completed" ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <CircleAlert size={14} />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-[8px]">
                        {task.title}
                      </strong>
                      <small className="mt-0.5 line-clamp-2 text-[7px] leading-[1.55] opacity-75">
                        {task.status === "running"
                          ? task.pendingLabel
                          : task.status === "completed"
                            ? `${task.completedLabel}؛ برای مشاهده کلیک کن.`
                            : task.status === "canceled"
                              ? "عملیات توسط شما لغو شد."
                              : task.error || "عملیات مدل ناموفق بود."}
                      </small>
                    </span>
                    {task.status === "running" ? (
                      <button
                        type="button"
                        className="grid size-6 shrink-0 place-items-center rounded-md text-[#a5483e] hover:bg-[#fff1ef]"
                        aria-label={`لغو ${task.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          cancelTask(task.id);
                        }}
                      >
                        <X size={13} />
                      </button>
                    ) : (
                      <ChevronLeft className="shrink-0 opacity-55" size={13} />
                    )}
                  </div>
                ))}
              </section>
            )}
            {!isManagement && <div className="-mx-1 -mb-1 min-w-0 max-w-full border-t border-[#e7ebe6] px-[5px] pt-[17px]">
              <button
                className="m-0 flex w-full min-w-0 items-center gap-[9px] overflow-hidden border-0 bg-transparent p-0 text-right"
                onClick={() => setDialog("profiles")}
                type="button"
              >
                <span className="flex w-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <strong
                    className="block w-full truncate text-[11px]"
                    title={activeWorkspace?.workspaceName || "فضای کاری شخصی"}
                  >
                    {activeWorkspace?.workspaceName || "فضای کاری شخصی"}
                  </strong>
                  <small className="mt-0.5 block w-full truncate text-[9px] text-[#9aa4a2]">
                    مدیریت فضاهای کاری
                  </small>
                </span>
                <ChevronLeft className="shrink-0" size={15} />
              </button>
            </div>}
          </div>
        </aside>
        <main className="ms-[248px] min-w-0 w-[calc(100%-248px)] max-[820px]:ms-0 max-[820px]:w-full">
          <header className="sticky top-0 z-12 flex h-[70px] items-center border-b border-[rgba(226,231,225,.85)] bg-[rgba(246,247,242,.9)] px-[clamp(24px,4vw,60px)] backdrop-blur-[14px] max-[820px]:h-[62px] max-[820px]:px-[18px]">
            <div className="hidden items-center gap-2 max-[820px]:flex">
              <span className="grid size-8 place-items-center rounded-[10px_10px_10px_4px] border border-[#cfe9df] bg-[#ecf8f3]">
                <Image
                  className="size-[21px]"
                  src="/logo.svg"
                  width={21}
                  height={21}
                  alt=""
                />
              </span>
              <strong>رادیکار</strong>
            </div>
            <span className="text-[11px] text-[#8c9996] max-[820px]:hidden">
              {title}
            </span>
            <div className="mr-auto flex items-center gap-[10px]">
              {!isManagement && <button
                className="flex h-[38px] w-[210px] items-center gap-2 rounded-[11px] border border-[#e4e8e3] bg-white/85 px-[11px] text-[11px] text-[#8a9693] max-[820px]:hidden"
                onClick={() => setDialog("search")}
              >
                <Search size={18} />
                <span>جست‌وجو...</span>
                <kbd className="mr-auto rounded-[5px] border border-[#e1e5e0] bg-[#f7f8f5] px-1.5 py-0.5 font-[inherit] text-[#a5aeac]">
                  ⌘ K
                </kbd>
              </button>}
              {(userRole === "user" || isSuperadmin) && (
                <div className="relative" ref={noticeRef}>
                  <button
                    className="relative grid size-[38px] place-items-center rounded-[11px] border border-[#e4e8e3] bg-white text-[#60716e]"
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (!noticeOpen && isSuperadmin) {
                        setSeenAdminEventIds(
                          new Set((adminEvents.data?.items ?? []).map((event) => event.id)),
                        );
                      }
                      setNoticeOpen((value) => !value);
                    }}
                    aria-label={isSuperadmin ? "اعلان‌های آماری مدیریت" : "اعلان‌ها"}
                    aria-expanded={noticeOpen}
                  >
                    <Bell size={19} />
                    {(latestJob || unreadAdminEvents.length > 0) && (
                      <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full border border-white bg-[#e7835c] px-1 text-[7px] font-bold leading-none text-white">
                        {isSuperadmin
                          ? Math.min(unreadAdminEvents.length, 99).toLocaleString("fa-IR")
                          : ""}
                      </span>
                    )}
                  </button>
                  {noticeOpen && isSuperadmin && (
                    <div className="absolute left-0 top-[46px] z-40 w-[360px] overflow-hidden rounded-[16px] border border-[#dfe6e1] bg-white shadow-[0_18px_50px_rgba(25,57,50,.18)] max-[420px]:fixed max-[420px]:inset-x-3 max-[420px]:top-[68px] max-[420px]:w-auto">
                      <div className="border-b border-[#edf0ec] px-4 py-3.5">
                        <strong className="block text-[12px] text-[#19312f]">رویدادهای جدید سامانه</strong>
                        <small className="mt-1 block text-[8px] text-[#91a09c]">ثبت‌نام، ورود، خرید و ساخت رزومه · به‌روزرسانی هر ۱۵ ثانیه</small>
                      </div>
                      <div className="grid max-h-[420px] gap-1 overflow-y-auto p-2">
                        {(adminEvents.data?.items ?? []).map((event) => {
                          const Icon =
                            event.type === "signup"
                              ? UserPlus
                              : event.type === "login"
                                ? Activity
                                : event.type === "purchase"
                                  ? ShoppingBag
                                  : FilePlus2;
                          return (
                            <Link
                              className="flex min-h-[58px] items-start gap-3 rounded-[11px] px-2.5 py-2 text-[#536762] no-underline hover:bg-[#edf6f1]"
                              href={adminEventHref(event.type)}
                              key={event.id}
                              onClick={() => setNoticeOpen(false)}
                            >
                              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#eaf5f0] text-[#0f7b62]"><Icon size={17} /></span>
                              <span className="min-w-0 flex-1">
                                <strong className="block text-[9px] leading-6 text-[#334c48]">{adminEventMessage(event)}</strong>
                                <small className="mt-0.5 block text-[7px] text-[#93a19e]">
                                  <span dir="ltr">{event.user.phone}</span> · {adminEventTime(event.createdAt)}
                                </small>
                              </span>
                            </Link>
                          );
                        })}
                        {!adminEvents.isLoading && (adminEvents.data?.items.length ?? 0) === 0 && (
                          <p className="m-0 px-3 py-8 text-center text-[9px] text-[#8b9996]">هنوز رویدادی ثبت نشده است.</p>
                        )}
                        {adminEvents.isLoading && (
                          <p className="m-0 px-3 py-8 text-center text-[9px] text-[#8b9996]">در حال دریافت رویدادها...</p>
                        )}
                      </div>
                      {adminEvents.isError && (
                        <p className="m-0 border-t border-[#f0dfdb] bg-[#fff7f5] px-4 py-2 text-[8px] text-[#a13f37]">دریافت رویدادها ناموفق بود؛ چند لحظه دیگر دوباره بررسی می‌شود.</p>
                      )}
                    </div>
                  )}
                  {noticeOpen && userRole === "user" && (
                    <div className="absolute left-0 top-[46px] w-[255px] rounded-[14px] border border-[#e7ebe6] bg-white p-4 shadow-[0_18px_45px_rgba(28,54,50,.15)]">
                      <strong className="text-xs">{latestJob?.role || "اعلان تازه‌ای نیست"}</strong>
                      <p className="my-[5px] text-[10px] leading-[1.8] text-[#758582]">
                        {latestJob ? `${latestJob.company}${latestJob.match > 0 ? ` · تطابق ${latestJob.match.toLocaleString("fa-IR")}٪` : ""}` : "فرصت‌های واردشده و رویدادهای واقعی اینجا نمایش داده می‌شوند."}
                      </p>
                      {latestJob && <Link className="p-0 text-[10px] font-bold text-[#0f7b62] no-underline" href="/jobs" onClick={() => setNoticeOpen(false)}>مشاهده فرصت</Link>}
                    </div>
                  )}
                </div>
              )}
              <div className="relative" ref={userMenuRef}>
                <button
                  aria-expanded={userMenuOpen}
                  aria-label="منوی حساب کاربری"
                  className="flex h-[38px] min-w-0 items-center gap-2 rounded-[11px] border border-[#e4e8e3] bg-white px-1.5 pe-2.5 text-[#526762]"
                  onClick={() => {
                    setNoticeOpen(false);
                    setUserMenuOpen((value) => !value);
                  }}
                  type="button"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-[#c98465] text-[9px] font-bold text-white">
                    {initials(user?.fullName || user?.phone || "")}
                  </span>
                  <span className="max-w-[110px] truncate text-[9px] font-bold max-[820px]:hidden">
                    {user?.fullName || "حساب کاربری"}
                  </span>
                  <ChevronLeft className={`shrink-0 transition-transform max-[820px]:hidden ${userMenuOpen ? "-rotate-90" : ""}`} size={13} />
                </button>
                {userMenuOpen && (
                  <div className="absolute left-0 top-[46px] z-40 w-[270px] overflow-hidden rounded-[16px] border border-[#dfe6e1] bg-white p-2 shadow-[0_18px_50px_rgba(25,57,50,.18)]">
                    {(isManagement
                      ? [{ href: "/settings", label: "تنظیمات و امنیت", icon: Settings }]
                      : [
                          { href: "/account", label: "حساب کاربری", icon: UserRound },
                          { href: "/settings", label: "تنظیمات", icon: Settings },
                          { href: "/orders", label: "سفارش‌ها", icon: ReceiptText },
                          { href: "/upgrade", label: "خرید و ارتقای بسته", icon: CreditCard },
                        ]
                    ).map(({ href, label, icon: Icon }) => (
                      <Link
                        className="flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[11px] font-semibold text-[#536762] no-underline hover:bg-[#edf6f1] hover:text-[#0f7b62]"
                        href={href}
                        key={href}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Icon size={18} /> {label}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-[#edf0ec]" />
                    <button
                      className="flex min-h-11 w-full items-center gap-3 rounded-[10px] border-0 bg-transparent px-3 text-right text-[11px] font-semibold text-[#a13f37] hover:bg-[#fff1ef]"
                      onClick={() => {
                        setUserMenuOpen(false);
                        void logout().catch(() => notify("خروج از حساب ناموفق بود؛ دوباره تلاش کن.", "error"));
                      }}
                      type="button"
                    >
                      <LogOut size={18} /> خروج از حساب
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <div className="mx-auto max-w-[1460px] px-[clamp(24px,4vw,60px)] pb-[70px] pt-[38px] max-[820px]:px-4 max-[820px]:pb-[90px] max-[820px]:pt-[25px]">
            {children}
          </div>
        </main>
        <nav
          className="fixed inset-x-0 bottom-0 z-30 hidden min-h-[66px] overflow-x-auto border-t border-[#e7ebe6] bg-white/96 px-[7px] pb-2 pt-[7px] backdrop-blur-xl max-[820px]:flex"
          aria-label="منوی موبایل"
        >
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                className={cn(
                  "flex min-w-[72px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[9px] border-0 text-[8px] no-underline",
                  active
                    ? "bg-[#edf6f1] text-[#0f7b62]"
                    : "bg-transparent text-[#8a9794]",
                )}
                href={item.href}
              >
                <Icon size={19} />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
        {dialog === "search" && (
          <Modal
            title="جست‌وجوی سریع"
            description="مستقیم به هر بخش یا اقدام برو."
            onClose={() => setDialog(null)}
          >
            <div className="pt-4">
              <div className="mb-[9px] flex h-[46px] items-center gap-[9px] rounded-[11px] border border-[#dfe5df] bg-[#fafbf9] px-3">
                <Search size={18} />
                <input
                  className="flex-1 border-0 bg-transparent text-[10px] outline-0 placeholder:text-right"
                  autoFocus
                  placeholder="مثلاً رزومه، فرصت شغلی یا مصاحبه..."
                />
              </div>
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    className="flex min-h-[43px] w-full items-center gap-[10px] rounded-[9px] px-[10px] text-right text-[10px] text-[#60716e] no-underline hover:bg-[#edf6f1] hover:text-[#0f7b62]"
                    key={item.href}
                    href={item.href}
                    onClick={() => setDialog(null)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    <ChevronLeft className="mr-auto" size={16} />
                  </Link>
                );
              })}
            </div>
          </Modal>
        )}
        {dialog === "profiles" && (
          <Modal
            title="فضاهای کاری"
            description="هر فضای کاری رزومه‌ها، فرصت‌ها، اپلای‌ها و جلسه‌های مستقل خودش را دارد و نام آن به اطلاعات پایگاه دانش ارتباطی ندارد."
            onClose={() => setDialog(null)}
          >
            <div className="grid gap-2 pt-4">
              {profiles.map((item) => {
                const active = item.id === activeProfileId;
                const editing = item.id === editingWorkspaceId;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex min-h-[62px] w-full items-center gap-[10px] rounded-xl border p-[10px] transition-[border-color,background-color,box-shadow]",
                      active
                        ? "border-[#8fc8b7] border-r-[5px] border-r-[#0f7b62] bg-[#edf7f2] shadow-[0_8px_20px_rgba(15,123,98,.1)]"
                        : "border-[#e7ebe6] bg-[#fbfcfa]",
                    )}
                  >
                    {editing ? (
                      <>
                        <input
                          className="min-h-10 min-w-0 flex-1 rounded-[9px] border border-[#c9ddd4] bg-white px-3 text-[10px] outline-none focus:border-[#79b8a5] focus:ring-3 focus:ring-[#e5f2ed]"
                          autoFocus
                          value={editingWorkspaceName}
                          onChange={(event) =>
                            setEditingWorkspaceName(event.target.value)
                          }
                          onKeyDown={(event) =>
                            event.key === "Enter" && void saveWorkspaceName()
                          }
                        />
                        <button
                          className={secondaryButtonClass}
                          type="button"
                          onClick={() => {
                            setEditingWorkspaceId("");
                            setEditingWorkspaceName("");
                          }}
                        >
                          انصراف
                        </button>
                        <button
                          className={primaryButtonClass}
                          type="button"
                          onClick={() => void saveWorkspaceName()}
                        >
                          ذخیره
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="flex min-w-0 flex-1 items-center gap-[10px] border-0 bg-transparent p-0 text-right"
                          type="button"
                          onClick={() => void switchProfile(item.id)}
                        >
                          <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-[#19312f]">
                            {item.workspaceName}
                          </span>
                        </button>
                        <button
                          className="grid size-7 shrink-0 place-items-center border-0 bg-transparent p-0 text-[#71817e] transition-colors hover:text-[#0f7b62]"
                          type="button"
                          aria-label={`ویرایش ${item.workspaceName}`}
                          onClick={() => {
                            setEditingWorkspaceId(item.id);
                            setEditingWorkspaceName(item.workspaceName);
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="-mr-2 grid size-7 shrink-0 place-items-center border-0 bg-transparent p-0 text-[#c25b50] transition-colors hover:text-[#a93f36]"
                          type="button"
                          aria-label={`حذف ${item.workspaceName}`}
                          onClick={() => {
                            setArmedWorkspaceDeleteId("");
                            setPendingWorkspaceDelete(item);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                        {active && (
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#0f7b62] text-white shadow-[0_5px_12px_rgba(15,123,98,.22)]">
                            <Check size={15} strokeWidth={2.5} />
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {addingProfile ? (
                <div className="mt-[3px] grid gap-3 rounded-xl border border-[#d8e6df] bg-[#f7faf8] p-[14px] [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[9px] [&_label]:font-bold [&_label]:text-[#536562] [&_input]:w-full [&_input]:rounded-[9px] [&_input]:border [&_input]:border-[#dfe5df] [&_input]:bg-white [&_input]:p-[10px] [&_input]:text-[10px] [&_input]:outline-0">
                  <label>
                    نام فضای کاری
                    <input
                      autoFocus
                      value={newWorkspaceName}
                      onChange={(event) =>
                        setNewWorkspaceName(event.target.value)
                      }
                      onKeyDown={(event) =>
                        event.key === "Enter" && void addProfile()
                      }
                    />
                  </label>
                  <div className="flex justify-end gap-2 pt-[5px] max-[560px]:flex-col-reverse">
                    <button
                      className={secondaryButtonClass}
                      onClick={() => {
                        setAddingProfile(false);
                        setNewWorkspaceName("");
                      }}
                    >
                      انصراف
                    </button>
                    <button
                      className={primaryButtonClass}
                      onClick={() => void addProfile()}
                    >
                      ساخت و ورود به فضا
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="flex min-h-[58px] w-full items-center gap-[10px] rounded-xl border border-dashed border-[#e7ebe6] bg-[#fbfcfa] p-[10px] text-right text-[#0f7b62]"
                  onClick={() => setAddingProfile(true)}
                >
                  <Plus size={18} />
                  <span className="flex flex-1 flex-col">
                    <strong className="text-[10px] text-[#19312f]">
                      افزودن فضای کاری جدید
                    </strong>
                    <small className="mt-[3px] text-[8px] text-[#758582]">
                      یک فضای مستقل با نام دلخواه بساز.
                    </small>
                  </span>
                </button>
              )}
            </div>
          </Modal>
        )}
        {pendingWorkspaceDelete && (
          <DeleteConfirmModal
            itemName={`فضای کاری ${pendingWorkspaceDelete.workspaceName} و تمام اطلاعات داخل آن`}
            onCancel={() => {
              setArmedWorkspaceDeleteId("");
              setPendingWorkspaceDelete(null);
            }}
            onConfirm={() => void confirmWorkspaceDelete()}
          />
        )}
    </div>
  );
}
