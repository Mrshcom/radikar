"use client";

import { useState } from "react";
import { ArrowLeft, Clock3, Plus, Target } from "lucide-react";
import { Modal, SectionTitle } from "../_components/ui";
import { useToast } from "../_components/panel-shell";

export default function ApplicationsPage() {
  const notify = useToast();
  const [columns, setColumns] = useState([{ title: "ذخیره‌شده", items: [{ name: "مدیر محصول ارشد", company: "دیجی‌کالا", match: "۹۱٪" }, { name: "Product Lead", company: "Careem", match: "۸۲٪" }] }, { title: "ارسال‌شده", items: [{ name: "Product Manager", company: "Quera", match: "۸۴٪" }] }, { title: "در حال بررسی", items: [{ name: "Senior Product Manager", company: "زرین‌پال", match: "۸۸٪" }] }, { title: "مصاحبه", items: [{ name: "Product Lead", company: "فلایتیو", match: "۹۰٪" }] }]);
  const [addOpen, setAddOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const addApplication = () => { if (!newRole.trim() || !newCompany.trim()) return; setColumns((current) => current.map((column, index) => index === 0 ? { ...column, items: [...column.items, { name: newRole, company: newCompany, match: "—" }] } : column)); setAddOpen(false); setNewRole(""); setNewCompany(""); notify("اپلای جدید به ستون ذخیره‌شده اضافه شد"); };
  const advance = (columnIndex: number, itemIndex: number) => { if (columnIndex >= columns.length - 1) { notify("این اپلای در آخرین مرحله قرار دارد"); return; } const item = columns[columnIndex].items[itemIndex]; setColumns((current) => current.map((column, index) => index === columnIndex ? { ...column, items: column.items.filter((_, i) => i !== itemIndex) } : index === columnIndex + 1 ? { ...column, items: [...column.items, item] } : column)); notify(`اپلای به مرحله «${columns[columnIndex + 1].title}» منتقل شد`); };
  const total = columns.reduce((sum, column) => sum + column.items.length, 0);

  return <><SectionTitle title="پیگیری اپلای‌ها" description="تمام فرصت‌ها را از ذخیره تا پیشنهاد همکاری در یک مسیر ببین." action={<button className="primary-btn" onClick={() => setAddOpen(true)}><Plus size={18} /> افزودن اپلای</button>} /><div className="pipeline-summary"><span><i className="dot blue-dot" /> {total} اپلای فعال</span><span>نرخ پاسخ <strong>۲۷٪</strong></span><span>میانگین پاسخ <strong>۶ روز</strong></span></div><div className="kanban">{columns.map((column, columnIndex) => <section className="kanban-column" key={column.title}><div className="kanban-head"><strong>{column.title}</strong><span>{column.items.length}</span></div>{column.items.map((item, itemIndex) => <article className="kanban-card" key={`${item.company}-${item.name}`}><div><span className="tiny-company">{item.company.slice(0, 1)}</span><small>{item.company}</small><button onClick={() => advance(columnIndex, itemIndex)} aria-label="انتقال به مرحله بعد"><ArrowLeft size={17} /></button></div><h3>{item.name}</h3><span className="match-pill"><Target size={12} /> تطابق {item.match}</span><footer><Clock3 size={13} /> به‌روزرسانی همین حالا</footer></article>)}</section>)}</div>{addOpen && <Modal title="افزودن اپلای" description="فرصت را ثبت کن تا در مسیر پیگیری قرار بگیرد." onClose={() => setAddOpen(false)}><div className="form-stack"><label>عنوان موقعیت<input value={newRole} onChange={(event) => setNewRole(event.target.value)} placeholder="مثلاً Product Manager" /></label><label>نام شرکت<input value={newCompany} onChange={(event) => setNewCompany(event.target.value)} placeholder="مثلاً دیجی‌کالا" /></label><div className="modal-actions"><button className="secondary-btn" onClick={() => setAddOpen(false)}>انصراف</button><button className="primary-btn" onClick={addApplication} disabled={!newRole.trim() || !newCompany.trim()}>افزودن به برد</button></div></div></Modal>}</>;
}
