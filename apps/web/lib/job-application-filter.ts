type JobIdentity = {
  id?: string;
  role: string;
  company: string;
  createdAt?: string;
};

type DatedApplication = JobIdentity & {
  jobId?: string;
  appliedAt?: string;
};

function normalizedPart(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fa")
    .replace(/\s+/g, " ");
}

function normalizedIdentity({ role, company }: JobIdentity) {
  return `${normalizedPart(role)}::${normalizedPart(company)}`;
}

function rangeBoundary(value: string, endOfDay: boolean) {
  if (!value)
    return endOfDay ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  return new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`,
  ).getTime();
}

function isTimeInRange(
  value: string | undefined,
  fromTime: number,
  toTime: number,
) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time >= fromTime && time <= toTime;
}

export function hasJobActivityInDateRange(
  job: JobIdentity,
  applications: readonly DatedApplication[],
  fromDate: string,
  toDate: string,
) {
  if (!fromDate && !toDate) return true;
  const identity = normalizedIdentity(job);
  const fromTime = rangeBoundary(fromDate, false);
  const toTime = rangeBoundary(toDate, true);

  const hasMatchingApplication = applications.some(
    (application) =>
      (Boolean(job.id && application.jobId === job.id) ||
        normalizedIdentity(application) === identity) &&
      isTimeInRange(application.appliedAt, fromTime, toTime),
  );

  return (
    hasMatchingApplication || isTimeInRange(job.createdAt, fromTime, toTime)
  );
}
