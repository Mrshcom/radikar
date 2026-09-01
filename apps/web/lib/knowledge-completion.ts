import type { KnowledgeProfileRecord } from "@/lib/data/models";
import { normalizeResumeImportPayload } from "@radicar/validators";

type KnowledgeCompletionData = Omit<
  KnowledgeProfileRecord,
  "id" | "createdAt" | "updatedAt"
>;

const sampleProjectIdPrefix = "project-sample-";

export function isSeededKnowledgeSampleProject(value: { id?: unknown }) {
  return (
    typeof value.id === "string" && value.id.startsWith(sampleProjectIdPrefix)
  );
}

export function calculateKnowledgeCompletion(data: KnowledgeCompletionData) {
  const safe = normalizeResumeImportPayload(data);
  const hasText = (value: unknown) =>
    typeof value === "string" && value.trim().length > 0;
  const completed = [
    safe.resumeData.fullName,
    safe.resumeData.jobTitle,
    safe.resumeData.email,
    safe.resumeData.phone,
    safe.resumeData.location,
    safe.resumeData.website,
    safe.resumeData.summary,
    safe.careerGoals,
    safe.preferredRoles,
    safe.preferredIndustries,
    safe.workPreferences,
    safe.skills,
    safe.interviewContext,
    safe.interviewChallenges,
    ...safe.experiences.flatMap((experience) => [
      experience.jobTitle,
      experience.company,
      experience.location,
      Boolean(
        hasText(experience.startDate) &&
          (experience.isCurrent || hasText(experience.endDate)),
      ),
      experience.description,
      experience.technologies,
    ]),
    ...safe.qualifications.flatMap((qualification) => [
      qualification.institution,
      qualification.credential,
      qualification.startDate,
      qualification.isCurrent || hasText(qualification.endDate),
    ]),
    ...safe.projects
      .filter((project) => !isSeededKnowledgeSampleProject(project))
      .flatMap((project) => [
        project.name,
        project.role,
        project.url,
        project.startDate,
        project.isCurrent || hasText(project.endDate),
        project.description,
        project.technologies,
      ]),
    ...safe.languageItems.flatMap((language) => [
      language.name,
      language.proficiency,
    ]),
  ].map((value) =>
    typeof value === "string" ? hasText(value) : Boolean(value),
  );

  if (!completed.length) return 0;
  return Math.round(
    (completed.filter(Boolean).length / completed.length) * 100,
  );
}
