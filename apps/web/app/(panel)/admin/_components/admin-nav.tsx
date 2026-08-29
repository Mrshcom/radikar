"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutDashboard, ReceiptText, Users } from "lucide-react";
import { useAuth } from "@/app/_components/auth";
import { cn } from "@/lib/cn";

export function AdminNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = [
    ...(user?.role === "superadmin" ? [{ href: "/admin", label: "گزارش کلی", icon: LayoutDashboard }] : []),
    { href: "/admin/memberships", label: "کاربران و عضویت", icon: Users },
    { href: "/admin/orders", label: "سفارش‌ها", icon: ReceiptText },
    { href: "/admin/payments", label: "واریزی‌ها", icon: CreditCard },
  ];
  return (
    <nav className="flex flex-wrap gap-2 rounded-[15px] border border-[#e3e9e3] bg-white p-2" aria-label="بخش‌های مدیریت">
      {items.map(({ href, label, icon: Icon }) => (
        <Link className={cn("flex min-h-10 items-center gap-2 rounded-[10px] px-4 text-[10px] font-bold no-underline", pathname === href ? "bg-[#e7f4ee] text-[#0f7b62]" : "text-[#687a76]")} href={href} key={href}><Icon size={16} />{label}</Link>
      ))}
    </nav>
  );
}
