import type { DataRecord, OnboardingRewardStep } from "@radikar/shared-types";
import { asObject, hasResumeContent } from "../ai/helpers";

export const ONBOARDING_REWARD_COINS = 100;
export const onboardingRewardSteps: OnboardingRewardStep[] = [
  "profile",
  "match",
  "resume",
  "application",
  "referral",
  "interview",
];
export const onboardingRewardKey = (userId: string) => `onboarding-completion:v1:${userId}`;

export function getOnboardingCompletedSteps(
  records: Array<{ collection: string; payload: DataRecord }>,
  confirmedReferral: boolean,
  profileId: string,
): OnboardingRewardStep[] {
  const scoped = records.filter(
    ({ payload }) => payload.profileId === profileId || (!payload.profileId && profileId === "profile-default"),
  );
  const hasRecord = (collection: string, predicate: (record: DataRecord) => boolean = () => true) =>
    scoped.some((record) => record.collection === collection && predicate(record.payload));
  const completed: Record<OnboardingRewardStep, boolean> = {
    profile: hasRecord(
      "knowledgeProfiles",
      (record) =>
        hasResumeContent(asObject(record.resumeData)) ||
        [record.careerGoals, record.skills].some((value) => typeof value === "string" && Boolean(value.trim())),
    ),
    match: hasRecord("matchAnalyses"),
    resume: hasRecord("resumes", (record) => hasResumeContent(asObject(record.data))),
    application: hasRecord("applications"),
    referral: confirmedReferral,
    interview: hasRecord(
      "interviewSessions",
      (record) =>
        (Array.isArray(record.feedbacks) && record.feedbacks.length > 0) ||
        (Array.isArray(asObject(record.report).questions) &&
          (asObject(record.report).questions as unknown[]).length > 0),
    ),
  };
  return onboardingRewardSteps.filter((step) => completed[step]);
}
