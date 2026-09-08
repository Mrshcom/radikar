import type {
  ApplicationRecord,
  ApplicationStage,
  JobRecord,
} from "@/lib/data/models";

export const applicationPipelineStages: ReadonlyArray<{
  id: ApplicationStage;
  title: string;
}> = [
  { id: "saved", title: "ذخیره‌شده" },
  { id: "applied", title: "ارسال‌شده" },
  { id: "review", title: "در حال بررسی" },
  { id: "interview", title: "مصاحبه" },
];

export function createSavedApplicationForJob(
  job: JobRecord,
): ApplicationRecord {
  return {
    id: `application-${job.id}`,
    jobId: job.id,
    role: job.role,
    company: job.company,
    stage: "saved",
    match: job.match,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function synchronizeJobsWithApplicationBoard(
  jobs: readonly JobRecord[],
  applications: readonly ApplicationRecord[],
) {
  const linkedJobIds = new Set(
    applications.map((application) => application.jobId).filter(Boolean),
  );
  const dismissedJobIds = new Set(
    jobs
      .filter((job) => Boolean(job.applicationBoardDismissedAt))
      .map((job) => job.id),
  );
  const retainedApplications = applications.filter(
    (application) =>
      !(
        application.stage === "saved" &&
        application.jobId &&
        dismissedJobIds.has(application.jobId)
      ),
  );
  const additions = jobs
    .filter(
      (job) =>
        !job.applicationBoardDismissedAt && !linkedJobIds.has(job.id),
    )
    .map(createSavedApplicationForJob);

  return {
    additions,
    applications: [...additions, ...retainedApplications].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    ),
  };
}

export function moveApplicationToStage(
  application: ApplicationRecord,
  stage: ApplicationStage,
  updatedAt: string,
): ApplicationRecord {
  if (stage === application.stage) return application;
  return {
    ...application,
    stage,
    appliedAt:
      stage === "saved" ? undefined : application.appliedAt ?? updatedAt,
    updatedAt,
  };
}
