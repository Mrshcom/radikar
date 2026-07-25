import type {
  ApplicationRecord,
  DashboardSnapshotRecord,
  DataCollection,
  InterviewSessionRecord,
  JobRecord,
  MatchAnalysisRecord,
  ResumeRecord,
  UserProfileRecord,
} from "./models";
import { getDataRepository } from "./repository";

function createStore<T extends { id: string; createdAt: string; updatedAt: string }>(collection: DataCollection) {
  return {
    async list() {
      const records = await getDataRepository().list<T>(collection);
      return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    get(id: string) {
      return getDataRepository().get<T>(collection, id);
    },
    put(record: T) {
      return getDataRepository().put(collection, record);
    },
    remove(id: string) {
      return getDataRepository().remove(collection, id);
    },
    clear() {
      return getDataRepository().clear(collection);
    },
  };
}

export function createRecordId(prefix: string) {
  const randomPart = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomPart}`;
}

export const userProfileStore = createStore<UserProfileRecord>("userProfiles");
export const resumeStore = createStore<ResumeRecord>("resumes");
export const jobStore = createStore<JobRecord>("jobs");
export const applicationStore = createStore<ApplicationRecord>("applications");
export const interviewSessionStore = createStore<InterviewSessionRecord>("interviewSessions");
export const matchAnalysisStore = createStore<MatchAnalysisRecord>("matchAnalyses");
export const dashboardSnapshotStore = createStore<DashboardSnapshotRecord>("dashboardSnapshots");

export async function getLatestResume() {
  return (await resumeStore.list())[0];
}
