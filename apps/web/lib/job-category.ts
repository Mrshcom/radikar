type ClassifiableJob = {
  place?: string;
  description?: string;
};

export type JobCategory = "domestic" | "international" | "remote";

const iranSignals =
  /(?:ایران|تهران|کرج|اصفهان|شیراز|مشهد|تبریز|قم|اهواز|رشت|مازندران|قزوین|ارومیه|یزد|کرمان|همدان|کیش|iran|tehran|karaj|isfahan|esfahan|shiraz|mashhad|tabriz)/i;

const remoteSignals =
  /(?:دورکار(?:ی)?|ریموت|کار\s*از\s*خانه|remote(?:ly)?|work(?:ing)?\s+from\s+home|home[-\s]?based|distributed\s+(?:team|workforce))/i;

const internationalSignals =
  /(?:بین[‌\s-]*المللی|خارج\s+از\s+ایران|اروپا|آمریکا|کانادا|استرالیا|امارات|انگلستان|آلمان|هلند|فرانسه|سوئد|نروژ|دانمارک|فنلاند|ترکیه|آفریقای\s+جنوبی|worldwide|global(?:ly)?|anywhere\s+in\s+the\s+world|international|emea|europe|united\s+states|u\.?s\.?a\.?|canada|australia|united\s+kingdom|u\.?k\.?|germany|netherlands|france|sweden|norway|denmark|finland|turkey|south\s+africa|dubai|united\s+arab\s+emirates|u\.?a\.?e\.?)/i;

function normalized(value: string | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function inferJobCategories(job: ClassifiableJob) {
  const place = normalized(job.place);
  const searchableText = `${place}\n${normalized(job.description)}`;
  const categories = new Set<JobCategory>();

  if (remoteSignals.test(searchableText)) categories.add("remote");
  if (iranSignals.test(searchableText)) categories.add("domestic");

  const explicitInternationalSignal = internationalSignals.test(searchableText);
  const nonIranianLatinPlace =
    Boolean(place) && /[a-z]/i.test(place) && !iranSignals.test(place);
  if (explicitInternationalSignal || nonIranianLatinPlace)
    categories.add("international");

  return categories;
}

export function matchesJobCategory(
  job: ClassifiableJob,
  category: JobCategory,
) {
  return inferJobCategories(job).has(category);
}
