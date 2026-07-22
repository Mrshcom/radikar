export const jobs = [
  { company: "دیجی‌کالا", role: "مدیر محصول ارشد", match: 91, place: "تهران · هیبرید", age: "۲ ساعت پیش", tone: "coral", letter: "د" },
  { company: "Snapp!", role: "Senior Product Manager", match: 86, place: "تهران · حضوری", age: "امروز", tone: "green", letter: "S" },
  { company: "Careem", role: "Product Lead — Growth", match: 82, place: "دبی · هیبرید", age: "۱ روز پیش", tone: "navy", letter: "C" },
];

export const recentApplications = [
  { company: "فلایتیو", role: "Product Lead", stage: "مصاحبه فنی", stageClass: "violet", date: "۲۲ تیر", logo: "ف" },
  { company: "زرین‌پال", role: "Senior Product Manager", stage: "بررسی رزومه", stageClass: "amber", date: "۲۰ تیر", logo: "ز" },
  { company: "Quera", role: "Product Manager", stage: "ارسال شده", stageClass: "blue", date: "۱۸ تیر", logo: "Q" },
];

export type Job = (typeof jobs)[number];
