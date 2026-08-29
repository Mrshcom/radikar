"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";
import { formatTomans, type Order, type Plan } from "@/lib/billing";
import { AdminNav } from "../_components/admin-nav";

type Response = { items: Array<{ order: Order; plan: Plan; user: { phone: string; fullName: string | null } }>; total: number };
export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["admin", "orders", page], queryFn: () => apiRequest<Response>(`/api/admin/orders?page=${page}&pageSize=20`), enabled: user?.role !== "user", staleTime: 15_000, placeholderData: keepPreviousData });
  if (user?.role === "user") return null;
  return <div className="grid gap-6"><AdminNav /><header><h1 className="m-0 text-[25px] font-black">سفارش‌ها و پیگیری وضعیت</h1></header><section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse text-right text-[10px]"><thead className="bg-[#f7f9f6]"><tr>{["سفارش", "کاربر", "پلن", "مبلغ", "وضعیت", "تاریخ", "پیگیری"].map((item) => <th className="px-4 py-3" key={item}>{item}</th>)}</tr></thead><tbody>{(query.data?.items ?? []).map(({ order, plan, user: owner }) => <tr className="border-t border-[#edf0ec]" key={order.id}><td className="px-4 py-4" dir="ltr">{order.orderNumber}</td><td className="px-4 py-4">{owner.fullName || owner.phone}</td><td className="px-4 py-4">{plan.name}</td><td className="px-4 py-4">{formatTomans(order.amountRials)} تومان</td><td className="px-4 py-4">{order.status}</td><td className="px-4 py-4">{new Date(order.createdAt).toLocaleDateString("fa-IR")}</td><td className="px-4 py-4" dir="ltr">{order.refId || "—"}</td></tr>)}</tbody></table></div><div className="flex justify-between border-t border-[#edf0ec] p-4 text-[9px]"><button disabled={page === 1} onClick={() => setPage((v) => v - 1)}>قبل</button><span>صفحه {page.toLocaleString("fa-IR")}</span><button disabled={(query.data?.items.length ?? 0) < 20} onClick={() => setPage((v) => v + 1)}>بعد</button></div></section></div>;
}
