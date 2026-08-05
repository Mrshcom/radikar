import type { ResumeData } from "./resume-data";

export const templatePreviewData: ResumeData = {
  fullName: "علی محمدی",
  jobTitle: "مدیر ارشد محصول",
  photoUrl: "/images/default-resume-profile.png",
  email: "ali.mohammadi@example.com",
  phone: "۰۹۱۲ ۱۲۳ ۴۵۶۷",
  location: "تهران، ایران",
  website: "linkedin.com/in/ali-mohammadi",
  summary:
    "مدیر محصول نتیجه‌محور با بیش از هشت سال تجربه در طراحی و توسعه محصولات دیجیتال. متخصص در تبدیل مسئله‌های پیچیده کاربران به راهکارهای ساده، هدایت تیم‌های چندتخصصی و رشد محصولات داده‌محور.",
  experienceTitle: "مدیر ارشد محصول",
  company: "گروه فناوری آریا",
  experienceDate: "فروردین ۱۴۰۱ تا امروز",
  experience:
    "رهبری تیم محصول و طراحی برای توسعه سه محصول B2B\nافزایش ۳۵ درصدی نرخ فعال‌سازی کاربران با بازطراحی فرایند شروع\nکاهش ۲۵ درصدی زمان تحویل قابلیت‌ها با بهبود فرایند کشف محصول\nطراحی و پایش شاخص‌های کلیدی محصول و اجرای آزمایش‌های رشد",
  experiences: [
    {
      id: "preview-experience-1",
      jobTitle: "مدیر ارشد محصول",
      company: "گروه فناوری آریا",
      location: "تهران",
      startDate: "فروردین ۱۴۰۱",
      endDate: "",
      isCurrent: true,
      description:
        "رهبری تیم محصول و طراحی برای توسعه سه محصول B2B\nافزایش ۳۵ درصدی نرخ فعال‌سازی کاربران با بازطراحی فرایند شروع\nکاهش ۲۵ درصدی زمان تحویل قابلیت‌ها با بهبود فرایند کشف محصول",
      technologies: "تحلیل داده، مدیریت چابک",
    },
    {
      id: "preview-experience-2",
      jobTitle: "مدیر محصول",
      company: "راهکارهای هوشمند سپهر",
      location: "تهران",
      startDate: "تیر ۱۳۹۸",
      endDate: "اسفند ۱۴۰۰",
      isCurrent: false,
      description:
        "تدوین نقشه راه محصول و اولویت‌بندی قابلیت‌ها براساس داده‌های رفتاری\nراه‌اندازی سامانه بازخورد مشتری و افزایش ۲۸ درصدی رضایت کاربران",
      technologies: "تحقیقات کاربر، طراحی محصول",
    },
    {
      id: "preview-experience-3",
      jobTitle: "کارشناس توسعه محصول",
      company: "استودیو نوآوری فردا",
      location: "تهران",
      startDate: "مهر ۱۳۹۶",
      endDate: "خرداد ۱۳۹۸",
      isCurrent: false,
      description:
        "تحلیل بازار و همکاری با تیم طراحی برای ساخت نمونه‌های اولیه\nتهیه گزارش عملکرد محصول و پیشنهاد فرصت‌های بهبود تجربه کاربر",
      technologies: "تحلیل بازار، نمونه‌سازی",
    },
  ],
  education:
    "کارشناسی ارشد مدیریت فناوری اطلاعات، دانشگاه تهران — ۱۳۹۶\nکارشناسی مهندسی صنایع، دانشگاه علم و صنعت ایران — ۱۳۹۴",
  educations: [
    {
      id: "preview-education-1",
      institution: "دانشگاه تهران",
      credential: "کارشناسی ارشد مدیریت فناوری اطلاعات",
      startDate: "۱۳۹۴",
      endDate: "۱۳۹۶",
      isCurrent: false,
    },
    {
      id: "preview-education-2",
      institution: "دانشگاه علم و صنعت ایران",
      credential: "کارشناسی مهندسی صنایع",
      startDate: "۱۳۹۰",
      endDate: "۱۳۹۴",
      isCurrent: false,
    },
  ],
  skills:
    "استراتژی محصول، تحقیقات کاربر، تحلیل داده، طراحی تجربه کاربر، مدیریت چابک، رهبری تیم",
  languages: "فارسی — زبان مادری | انگلیسی — حرفه‌ای",
};
