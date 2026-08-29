export const dataCollections = [
  "appProfiles",
  "workspaceState",
  "userProfiles",
  "knowledgeProfiles",
  "resumes",
  "jobs",
  "applications",
  "interviewSessions",
  "matchAnalyses",
  "dashboardSnapshots",
] as const;

export type DataCollection = (typeof dataCollections)[number];

export type DataRecord = {
  id: string;
  profileId?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export type ApiError = {
  error: string;
  requestId?: string;
};
