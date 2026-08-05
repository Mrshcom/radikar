import type { JobTone } from "@/app/(panel)/_data/jobs";
import type {
  ResumeColorId,
  ResumeData,
} from "@/app/(panel)/resumes/resume-data";

export type DataCollection =
  | "appProfiles"
  | "workspaceState"
  | "userProfiles"
  | "knowledgeProfiles"
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
  profileId?: string;
};

export type AppProfileRecord = BaseRecord & {
  workspaceName: string;
  /** @deprecated فقط برای مهاجرت فضای کاری قدیمی */
  fullName?: string;
  /** @deprecated فقط برای مهاجرت فضای کاری قدیمی */
  targetTitle?: string;
};

export type WorkspaceStateRecord = BaseRecord & {
  activeProfileId: string;
};

export type UserProfileRecord = BaseRecord & {
  fullName: string;
  targetTitle: string;
  workMode: "" | "remote" | "hybrid" | "onsite";
};

export type KnowledgeExperience = {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  date?: string;
  description: string;
  technologies: string;
  /** @deprecated فقط برای مهاجرت داده‌های قدیمی */
  achievements?: string;
};

export type KnowledgeQualification = {
  id: string;
  institution: string;
  credential: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  /** @deprecated فقط برای مهاجرت داده‌های قدیمی */
  education?: string;
  /** @deprecated فقط برای مهاجرت داده‌های قدیمی */
  certifications?: string;
  /** @deprecated فقط برای مهاجرت داده‌های قدیمی */
  skills?: string;
  /** @deprecated فقط برای مهاجرت داده‌های قدیمی */
  languages?: string;
};

export type KnowledgeLanguage = {
  id: string;
  name: string;
  proficiency: string;
};

export type KnowledgeProfileRecord = BaseRecord & {
  resumeData: ResumeData;
  experiences: KnowledgeExperience[];
  qualifications: KnowledgeQualification[];
  skills: string;
  languages: string;
  languageItems: KnowledgeLanguage[];
  careerGoals: string;
  preferredRoles: string;
  preferredIndustries: string;
  workPreferences: string;
  /** @deprecated فقط برای مهاجرت داده‌های قدیمی */
  achievements?: string;
  certifications?: string;
  interviewContext: string;
  interviewChallenges: string;
};

export type ResumeRecord = BaseRecord & {
  name: string;
  templateId: string;
  colorId?: ResumeColorId;
  data: ResumeData;
  source: "user" | "tailored";
  targetJobId?: string;
  targetJobTitle?: string;
  targetCompany?: string;
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
  sourceId?: string;
  sourceType?: "knowledge" | "resume";
  sourceUpdatedAt?: string;
  greeting: string;
  subtitle: string;
  profileScore: number;
  heroTitle: string;
  heroText: string;
  aiTitle: string;
  aiText: string;
};
