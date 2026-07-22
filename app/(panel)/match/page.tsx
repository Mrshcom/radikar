"use client";

import { useRef, useState } from "react";
import { Check, CheckCircle2, ChevronLeft, FileText, Sparkles, Target, WandSparkles, X } from "lucide-react";
import { CircularProgress } from "../_components/circular-progress";
import { SectionTitle } from "../_components/ui";
import { useToast } from "../_components/panel-shell";

export default function MatchPage() {
  const notify = useToast();
  const [description, setDescription] = useState("ما به دنبال یک مدیر محصول ارشد با حداقل ۵ سال تجربه در توسعه محصولات دیجیتال، تحلیل داده و رهبری تیم‌های چندتخصصی هستیم...");
  const [analyzed, setAnalyzed] = useState(true);
  const [tailored, setTailored] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumePicker, setResumePicker] = useState(false);
  const [baseResume, setBaseResume] = useState("مدیر محصول — فارسی");
  const fileInput = useRef<HTMLInputElement>(null);
  const analyze = () => { setAnalyzing(true); setAnalyzed(false); window.setTimeout(() => { setAnalyzing(false); setAnalyzed(true); notify("تحلیل تطابق با موفقیت به‌روز شد"); }, 900); };
  const loadFile = (file?: File) => { if (!file) return; setDescription(`شرح شغل از فایل «${file.name}» استخراج شد.\n\nتجربه مدیریت محصول، تحلیل داده، طراحی آزمایش A/B، کار با تیم‌های فنی و توانایی تعریف و پایش شاخص‌های کلیدی موردنیاز است.`); setAnalyzed(false); notify("فایل شرح شغل اضافه شد"); };

  return <><SectionTitle title="تطبیق هوشمند با شغل" description="شرح شغل را وارد کن تا نقاط قوت، شکاف‌ها و بهترین نسخه رزومه مشخص شود." />{tailored && <div className="success-banner"><CheckCircle2 size={20} /><div><strong>نسخه اختصاصی ساخته شد</strong><span>پیش‌نویس جدید در بخش رزومه‌های من ذخیره شد.</span></div><button onClick={() => setTailored(false)}><X size={18} /></button></div>}<div className="match-layout">
    <section className="panel match-input-panel"><div className="step-label"><span>۱</span><div><strong>اطلاعات فرصت شغلی</strong><small>متن آگهی را وارد یا از فایل استخراج کن</small></div></div><label>شرح شغل</label><textarea value={description} onChange={(event) => { setDescription(event.target.value); setAnalyzed(false); }} /><input className="visually-hidden" ref={fileInput} type="file" accept=".txt,.pdf,.doc,.docx" onChange={(event) => loadFile(event.target.files?.[0])} /><div className="input-actions"><button className="secondary-btn" onClick={() => fileInput.current?.click()}><FileText size={17} /> افزودن فایل</button><span>{description.length} نویسه</span></div><label>رزومه مبنا</label><button className="resume-select" onClick={() => setResumePicker((value) => !value)}><div className="mini-file"><FileText size={18} /></div><div><strong>{baseResume}</strong><span>رزومه مبنا · ویرایش امروز</span></div><ChevronLeft size={18} /></button>{resumePicker && <div className="resume-picker">{["مدیر محصول — فارسی", "Senior Product Manager — English", "رزومه کوتاه ATS"].map((resume) => <button key={resume} className={baseResume === resume ? "active" : ""} onClick={() => { setBaseResume(resume); setResumePicker(false); setAnalyzed(false); }}><FileText size={16} />{resume}{baseResume === resume && <Check size={15} />}</button>)}</div>}<button className="primary-btn analyze-btn" disabled={!description.trim() || analyzing} onClick={analyze}><Sparkles size={18} /> {analyzing ? "در حال تحلیل..." : analyzed ? "تحلیل مجدد" : "تحلیل تطابق"}</button></section>
    <section className="panel analysis-panel">{analyzed ? <><div className="analysis-head"><CircularProgress className="large-score" value={91} label="تطابق رزومه ۹۱ درصد" strokeWidth={9}><strong>۹۱</strong><span>٪ تطابق</span></CircularProgress><div><span className="great-label">تطابق عالی</span><h2>مدیر محصول ارشد</h2><p>دیجی‌کالا · تهران</p></div></div><div className="score-breakdown">{[{ label: "مهارت‌های کلیدی", value: 94 }, { label: "سابقه مرتبط", value: 88 }, { label: "کلمات کلیدی ATS", value: 84 }].map((item) => <div key={item.label}><div><span>{item.label}</span><strong>{item.value}٪</strong></div><i><b style={{ width: `${item.value}%` }} /></i></div>)}</div><div className="keywords-block"><h3>آنچه به‌خوبی پوشش داده‌ای</h3><div><span><Check size={14} /> استراتژی محصول</span><span><Check size={14} /> تحلیل داده</span><span><Check size={14} /> Agile</span><span><Check size={14} /> رهبری تیم</span></div></div><div className="gap-block"><h3>فرصت‌های بهبود</h3><p><Sparkles size={16} /> عبارت «آزمایش A/B» در آگهی مهم است؛ یکی از تجربه‌های مرتبطت را برجسته کن.</p><p><Sparkles size={16} /> دو دستاورد رزومه بدون عدد و نتیجه قابل سنجش هستند.</p></div><button className="primary-btn full" onClick={() => { setTailored(true); notify("نسخه اختصاصی در رزومه‌های من ذخیره شد"); }}><WandSparkles size={18} /> ساخت رزومه اختصاصی</button></> : <div className="empty-analysis"><Target size={44} /><h3>آماده تحلیل</h3><p>شرح شغل را وارد کن تا گزارش تطبیق ساخته شود.</p></div>}</section>
  </div></>;
}
