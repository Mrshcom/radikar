import type { JobTone } from "@/app/(panel)/_data/jobs";
import type { ResumeData } from "@/app/(panel)/resumes/resume-data";

export type DataCollection =
  | "userProfiles"
  | "resumes"
  | "jobs"
  | "applications"
  | "interviewSessions"
  | "matchAnalyses"
  | "dashboardSnapshots";

export type BaseRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileRecord = BaseRecord & {
  fullName: string;
  targetTitle: string;
  workMode: "" | "remote" | "hybrid" | "onsite";
};

export type ResumeRecord = BaseRecord & {
  name: string;
  templateId: string;
  data: ResumeData;
  source: "user" | "tailored";
};

export type JobRecord = BaseRecord & {
  company: string;
  role: string;
  match: number;
  place: string;
  age: string;
  tone: JobTone;
  letter: string;
  reason?: string;
  description: string;
  sourceUrl?: string;
  saved: boolean;
};

export type ApplicationStage = "saved" | "applied" | "review" | "interview";

export type ApplicationRecord = BaseRecord & {
  role: string;
  company: string;
  stage: ApplicationStage;
  match?: number;
  appliedAt?: string;
};

export type InterviewFeedbackRecord = {
  question: string;
  answer: string;
  title: string;
  text: string;
  createdAt: string;
};

export type InterviewSessionRecord = BaseRecord & {
  title: string;
  subtitle: string;
  duration: string;
  mode: string;
  questions: string[];
  cards: Array<{ title: string; text: string; tone: string }>;
  feedbacks: InterviewFeedbackRecord[];
};

export type MatchAnalysisData = {
  score: number;
  jobTitle: string;
  company: string;
  breakdown: Array<{ label: string; value: number }>;
  strengths: string[];
  gaps: string[];
};

export type MatchAnalysisRecord = BaseRecord & {
  resumeId: string;
  jobDescription: string;
  sourceUrl?: string;
  analysis: MatchAnalysisData;
};

export type DashboardSnapshotRecord = BaseRecord & {
  resumeId: string;
  greeting: string;
  subtitle: string;
  profileScore: number;
  heroTitle: string;
  heroText: string;
  aiTitle: string;
  aiText: string;
};
