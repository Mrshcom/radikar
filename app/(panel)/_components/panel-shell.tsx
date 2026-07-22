"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, Bell, BriefcaseBusiness, Check, CheckCircle2, ChevronLeft, FileText, LayoutDashboard, MessageSquareText, Search, Settings, Sparkles, Target } from "lucide-react";
import { Modal } from "./ui";

const menuItems = [
  { href: "/dashboard", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/resumes", label: "رزومه‌های من", icon: FileText },
  { href: "/match", label: "تطبیق با شغل", icon: Target },
  { href: "/jobs", label: "فرصت‌های شغلی", icon: BriefcaseBusiness },
  { href: "/applications", label: "پیگیری اپلای‌ها", icon: BarChart3 },
  { href: "/interview", label: "آمادگی مصاحبه", icon: MessageSquareText },
];

const ToastContext = createContext<(message: string) => void>(() => undefined);
export const useToast = () => useContext(ToastContext);

export function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [dialog, setDialog] = useState<"search" | "settings" | "plan" | null>(null);
  const title = useMemo(() => menuItems.find((item) => item.href === pathname)?.label ?? "نمای کلی", [pathname]);
  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2800); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => { const openSearch = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setDialog("search"); } }; window.addEventListener("keydown", openSearch); return () => window.removeEventListener("keydown", openSearch); }, []);

  return <ToastContext.Provider value={notify}><div className="app-shell" dir="rtl">
    <aside className="sidebar">
      <Link className="brand" href="/dashboard"><span><Sparkles size={19} /></span><div><strong>مسیر</strong><small>همراه حرفه‌ای تو</small></div></Link>
      <nav aria-label="منوی اصلی"><span className="nav-caption">فضای کاری</span>{menuItems.map((item) => { const Icon = item.icon; return <Link key={item.href} className={pathname === item.href ? "active" : ""} href={item.href}><Icon size={19} /><span>{item.label}</span>{item.href === "/jobs" && <em>۱۲</em>}</Link>; })}</nav>
      <div className="sidebar-upgrade"><div className="upgrade-icon"><Sparkles size={18} /></div><strong>۷۰٪ از سهمیه این ماه</strong><p>۱۵ تحلیل هوشمند دیگر باقی مانده است.</p><div><i /></div><button onClick={() => setDialog("plan")}>مشاهده پلن حرفه‌ای</button></div>
      <div className="sidebar-user"><div className="avatar">سا</div><div><strong>سینا احمدی</strong><span>پلن حرفه‌ای</span></div><button aria-label="تنظیمات" onClick={() => setDialog("settings")}><Settings size={18} /></button></div>
    </aside>
    <main><header className="topbar"><div className="mobile-brand"><span><Sparkles size={17} /></span><strong>مسیر</strong></div><span className="current-page">{title}</span><div className="topbar-actions"><button className="search-button" onClick={() => setDialog("search")}><Search size={18} /><span>جست‌وجو...</span><kbd>⌘ K</kbd></button><button className="notification-button" onClick={() => setNoticeOpen((value) => !value)} aria-label="اعلان‌ها"><Bell size={19} /><i /></button>{noticeOpen && <div className="notice-popover"><strong>یک فرصت تازه برای تو</strong><p>موقعیت Product Lead با تطابق ۸۹٪ پیدا شد.</p><Link href="/jobs" onClick={() => setNoticeOpen(false)}>مشاهده فرصت</Link></div>}</div></header><div className="content">{children}</div></main>
    <nav className="mobile-nav" aria-label="منوی موبایل">{menuItems.slice(0, 5).map((item) => { const Icon = item.icon; return <Link key={item.href} className={pathname === item.href ? "active" : ""} href={item.href}><Icon size={19} /><span>{item.label.split(" ")[0]}</span></Link>; })}</nav>
    {toast && <div className="toast" role="status"><CheckCircle2 size={19} />{toast}</div>}
    {dialog === "search" && <Modal title="جست‌وجوی سریع" description="مستقیم به هر بخش یا اقدام برو." onClose={() => setDialog(null)}><div className="command-search"><div><Search size={18} /><input autoFocus placeholder="مثلاً رزومه، فرصت شغلی یا مصاحبه..." /></div>{menuItems.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setDialog(null)}><Icon size={18} /><span>{item.label}</span><ChevronLeft size={16} /></Link>; })}</div></Modal>}
    {dialog === "settings" && <Modal title="تنظیمات پروفایل" description="ترجیحات کاری برای پیشنهادهای دقیق‌تر استفاده می‌شوند." onClose={() => setDialog(null)}><div className="form-stack"><label>نام و نام خانوادگی<input defaultValue="سینا احمدی" /></label><label>عنوان هدف<input defaultValue="Senior Product Manager" /></label><label>نوع همکاری<select defaultValue="هیبرید"><option>هیبرید</option><option>دورکاری</option><option>حضوری</option></select></label><div className="modal-actions"><button className="secondary-btn" onClick={() => setDialog(null)}>انصراف</button><button className="primary-btn" onClick={() => { setDialog(null); notify("تنظیمات پروفایل ذخیره شد"); }}>ذخیره تنظیمات</button></div></div></Modal>}
    {dialog === "plan" && <Modal title="پلن حرفه‌ای مسیر" description="امکانات فعال حساب و سهمیه ماهانه تو." onClose={() => setDialog(null)}><div className="plan-card"><div><Sparkles size={23} /><strong>حرفه‌ای</strong><span>فعال تا ۲۲ مرداد</span></div><ul><li><Check size={15} /> ۵۰ تحلیل هوشمند در ماه</li><li><Check size={15} /> رزومه و خروجی PDF نامحدود</li><li><Check size={15} /> تمرین مصاحبه و بازخورد</li><li><Check size={15} /> پیگیری نامحدود اپلای‌ها</li></ul><button className="primary-btn full" onClick={() => { setDialog(null); notify("صفحه مدیریت اشتراک آماده شد"); }}>مدیریت اشتراک</button></div></Modal>}
  </div></ToastContext.Provider>;
}
