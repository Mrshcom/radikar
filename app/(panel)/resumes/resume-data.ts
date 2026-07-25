export type ResumeData = { fullName: string; jobTitle: string; photoUrl: string; email: string; phone: string; location: string; website: string; summary: string; experienceTitle: string; company: string; experienceDate: string; experience: string; education: string; skills: string; languages: string };

export const resumeTemplates = [
  { id: "ats", name: "مینیمال ATS", subtitle: "ساده و مناسب سیستم‌های استخدام", tag: "پیشنهادی" }, { id: "emerald", name: "مدرن سبز", subtitle: "حرفه‌ای برای محصول و مارکتینگ", tag: "مدرن" }, { id: "classic", name: "کلاسیک رسمی", subtitle: "مناسب شرکت‌های رسمی و حقوقی", tag: "رسمی" }, { id: "navy", name: "دو ستونه حرفه‌ای", subtitle: "خوانا با تفکیک دقیق اطلاعات", tag: "محبوب" }, { id: "creative", name: "خلاق مرجانی", subtitle: "مناسب طراحی و صنایع خلاق", tag: "خلاق" }, { id: "executive", name: "مدیریتی Executive", subtitle: "ویژه مدیران ارشد و رهبران", tag: "مدیریتی" }, { id: "tech", name: "تکنولوژی", subtitle: "برای توسعه‌دهندگان و متخصصان داده", tag: "فنی" }, { id: "academic", name: "دانشگاهی", subtitle: "مناسب پژوهش، تدریس و اپلای", tag: "آکادمیک" }, { id: "global", name: "بین‌المللی Clean", subtitle: "استاندارد اپلای خارج از ایران", tag: "English-ready" }, { id: "persian", name: "فارسی اصیل", subtitle: "راست‌چین با هویت ایرانی", tag: "فارسی" },
  { id: "two-professional", name: "حرفه‌ای دوبلین", subtitle: "نوار تمام‌قد برای هویت، تماس و مهارت‌ها", tag: "حرفه‌ای" },
  { id: "two-clean", name: "مینیمال برلین", subtitle: "تک‌رنگ، خلوت و مبتنی بر تایپوگرافی", tag: "مینیمال" },
  { id: "two-corporate", name: "سازمانی نیویورک", subtitle: "ساختار رسمی و دقیق برای مسیر شغلی", tag: "شرکتی" },
  { id: "two-clear", name: "شفاف وین", subtitle: "هدر سبز برجسته با بدنه دو ستونه روشن", tag: "خوانا" },
  { id: "two-balanced", name: "متوازن سیدنی", subtitle: "بدنه سفید در کنار نوار تیره اطلاعات", tag: "متعادل" },
  { id: "two-essential", name: "ضروری استکهلم", subtitle: "چیدمان سفید، مینیمال و بسیار کاربردی", tag: "کاربردی" },
  { id: "two-polished", name: "آراسته پاریس", subtitle: "ستون مهارت باریک با تایپوگرافی ظریف", tag: "شیک" },
  { id: "two-harmonized", name: "هماهنگ میلان", subtitle: "فضای گرم با امتیازهای نقطه‌ای مهارت", tag: "هماهنگ" },
  { id: "two-defined", name: "متمایز تورنتو", subtitle: "نام بزرگ و بخش‌های ماژولار وب‌محور", tag: "دیجیتال" },
  { id: "two-industrial", name: "صنعتی آمستردام", subtitle: "کنتراست تیره و ساختار فنی قدرتمند", tag: "صنعتی" },
  { id: "two-elegant", name: "ظریف بارسلونا", subtitle: "فضای سفید و ستون مهارت باریک", tag: "ظریف" },
  { id: "two-modern", name: "مدرن توکیو", subtitle: "هدر قرمز و نمایش خطی سطح مهارت‌ها", tag: "مدرن" },
  { id: "two-creative", name: "خلاق لیسبون", subtitle: "پرتره برجسته و فرم‌های ارگانیک رنگی", tag: "خلاق" },
  { id: "two-visionary", name: "آینده‌نگر ریو", subtitle: "بافت گرم، هویت مرکزی و فرم‌های سیال", tag: "آینده‌نگر" },
  { id: "two-color-splash", name: "رنگی کیپ‌تاون", subtitle: "تایپوگرافی جسور روی لکه‌های رنگی", tag: "رنگی" },
  { id: "photo-creative", name: "پرتره ارگانیک", subtitle: "پرتره بزرگ، ساختار تحریریه‌ای و فرم‌های گیاهی", tag: "خلاق" },
  { id: "sector-orange", name: "نارنجی استودیو", subtitle: "ستون ذغالی و تیترهای نواری نارنجی", tag: "رنگی" },
  { id: "sector-yellow", name: "زرد گرافیک", subtitle: "هویت تیره با جزئیات زرد و تایم‌لاین", tag: "رنگی" },
  { id: "sector-turquoise", name: "فیروزه‌ای پزشکی", subtitle: "ستون هویتی رنگی و بدنه سفید خوانا", tag: "رنگی" },
  { id: "sector-green", name: "سبز مالی", subtitle: "هدر تیره، نوار تماس و بخش‌بندی سبز", tag: "رنگی" },
] as const;

export const emptyResumeData: ResumeData = {
  fullName: "",
  jobTitle: "",
  photoUrl: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  summary: "",
  experienceTitle: "",
  company: "",
  experienceDate: "",
  experience: "",
  education: "",
  skills: "",
  languages: "",
};

export function hasResumeContent(resume: Partial<ResumeData> | undefined): resume is ResumeData {
  if (!resume) return false;
  return Object.entries(resume).some(([key, value]) => key !== "photoUrl" && typeof value === "string" && value.trim().length > 0);
}
