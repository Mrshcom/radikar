import type { ResumeData } from "@/app/(panel)/resumes/resume-data";

export type PracticeCard = { title: string; text: string; tone: string };

const tones = ["mint", "lavender", "peach"] as const;

export function createPracticeCards(
  resumeData?: Partial<ResumeData>,
  knowledgeSkills = "",
  generatedCards: PracticeCard[] = [],
): PracticeCard[] {
  const jobTitle = resumeData?.jobTitle?.trim().slice(0, 40) || "نقش موردنظر";
  const skills = [
    resumeData?.skills,
    knowledgeSkills,
    ...(resumeData?.experiences?.map((item) => item.technologies) ?? []),
    ...(resumeData?.projects?.map((item) => item.technologies) ?? []),
  ]
    .filter(Boolean)
    .flatMap((value) => value!.split(/[,،؛;\n|•]+/))
    .map((value) => value.trim())
    .filter((value) => value.length >= 2 && value.length <= 48);

  const candidates: PracticeCard[] = [
    ...generatedCards.filter((card) => card.title.trim() && card.text.trim()),
    ...skills.map((skill) => ({
      title: skill,
      text: `تمرین تخصصی دربارهٔ ${skill}، تجربه‌های واقعی و تصمیم‌هایی که در کار با آن گرفته‌ای.`,
      tone: "mint",
    })),
    {
      title: `مهارت‌های تخصصی ${jobTitle}`,
      text: `گفت‌وگوی متمرکز بر مهارت‌ها و مسئولیت‌های اصلی نقش ${jobTitle}.`,
      tone: "mint",
    },
    {
      title: "چالش‌ها و حل مسئله",
      text: "تمرین دربارهٔ مسئله‌های واقعی، راه‌حل‌های انتخابی و نتیجهٔ آن‌ها.",
      tone: "lavender",
    },
    {
      title: "ابزارها و روش‌های کار",
      text: "گفت‌وگو دربارهٔ ابزارها، فرایندها و شیوهٔ انجام کار در پروژه‌ها.",
      tone: "peach",
    },
  ];

  const unique = new Set<string>();
  return candidates
    .filter((card) => {
      const key = card.title.trim().toLocaleLowerCase();
      if (unique.has(key)) return false;
      unique.add(key);
      return true;
    })
    .slice(0, 3)
    .map((card, index) => ({ ...card, tone: tones[index] }));
}
