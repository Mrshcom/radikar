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

export type ProductTimelineKind = "phase" | "feature" | "release";
export type ProductTimelineStatus = "planned" | "building" | "completed";
export type ProductStorySlide = {
  title: string;
  body: string;
  imagePath?: string;
  ctaLabel?: string;
  ctaHref?: string;
};
export type ProductTimelineEntry = {
  id: string;
  kind: ProductTimelineKind;
  phaseId: string | null;
  title: string;
  summary: string;
  status: ProductTimelineStatus;
  sortOrder: number;
  storySlides: ProductStorySlide[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type ProductTimelineInput = Pick<
  ProductTimelineEntry,
  "kind" | "phaseId" | "title" | "summary" | "status" | "sortOrder" | "storySlides"
>;

export type InterviewReport = {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  questions: Array<{
    questionIndex: number;
    score: number;
    feedback: string;
    strengths: string[];
    issues: string[];
    suggestedAnswer: string;
  }>;
};

export type OnboardingRewardStep = "profile" | "match" | "resume" | "application" | "referral" | "interview";
export type OnboardingRewardStatus = {
  amount: number;
  eligible: boolean;
  claimed: boolean;
  completedSteps: OnboardingRewardStep[];
};
