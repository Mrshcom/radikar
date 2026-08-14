import type { KnowledgeProfileRecord } from "@/lib/data/models";

type KnowledgeCompletionData = Omit<
  KnowledgeProfileRecord,
  "id" | "createdAt" | "updatedAt"
>;

export function calculateKnowledgeCompletion(data: KnowledgeCompletionData) {
  const completed = [
    data.resumeData.fullName,
    data.resumeData.jobTitle,
    data.resumeData.email,
    data.resumeData.phone,
    data.resumeData.location,
    data.resumeData.website,
    data.resumeData.summary,
    data.careerGoals,
    data.preferredRoles,
    data.preferredIndustries,
    data.workPreferences,
    data.skills,
    data.interviewContext,
    data.interviewChallenges,
    ...(data.experiences || []).flatMap((experience) => [
      experience.jobTitle,
      experience.company,
      experience.location,
      Boolean(
        experience.startDate.trim() &&
          (experience.isCurrent || experience.endDate.trim()),
      ),
      experience.description,
      experience.technologies,
    ]),
    ...(data.qualifications || []).flatMap((qualification) => [
      qualification.institution,
      qualification.credential,
      qualification.startDate,
      qualification.isCurrent || Boolean(qualification.endDate.trim()),
    ]),
    ...(data.projects || []).flatMap((project) => [
      project.name,
      project.role,
      project.url,
      project.startDate,
      project.isCurrent || Boolean(project.endDate.trim()),
      project.description,
      project.technologies,
    ]),
    ...(data.languageItems || []).flatMap((language) => [
      language.name,
      language.proficiency,
    ]),
  ].map((value) =>
    typeof value === "string" ? Boolean(value.trim()) : Boolean(value),
  );

  if (!completed.length) return 0;
  return Math.round(
    (completed.filter(Boolean).length / completed.length) * 100,
  );
}
