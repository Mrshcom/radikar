import type {
  AppProfileRecord,
  ApplicationRecord,
  DashboardSnapshotRecord,
  DataCollection,
  InterviewSessionRecord,
  JobRecord,
  KnowledgeProfileRecord,
  MatchAnalysisRecord,
  ResumeRecord,
  UserProfileRecord,
  WorkspaceStateRecord,
} from "./models";
import { getDataRepository } from "./repository";

export const DEFAULT_PROFILE_ID = "profile-default";
const ACTIVE_PROFILE_STATE_ID = "active-profile";

function createUnscopedStore<T extends { id: string; createdAt: string; updatedAt: string }>(collection: DataCollection) {
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

export const appProfileStore = createUnscopedStore<AppProfileRecord>("appProfiles");
const workspaceStateStore = createUnscopedStore<WorkspaceStateRecord>("workspaceState");

export async function getActiveProfileId() {
  return (await workspaceStateStore.get(ACTIVE_PROFILE_STATE_ID))?.activeProfileId ?? DEFAULT_PROFILE_ID;
}

export async function setActiveProfileId(activeProfileId: string) {
  const previous = await workspaceStateStore.get(ACTIVE_PROFILE_STATE_ID);
  const now = new Date().toISOString();
  await workspaceStateStore.put({
    id: ACTIVE_PROFILE_STATE_ID,
    activeProfileId,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  });
}

export async function ensureDefaultAppProfile() {
  const profiles = await appProfileStore.list();
  if (profiles.length) return profiles;

  const legacyProfile = await getDataRepository().get<UserProfileRecord>("userProfiles", "current-user");
  const latestResume = (await getDataRepository().list<ResumeRecord>("resumes"))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const now = new Date().toISOString();
  const profile: AppProfileRecord = {
    id: DEFAULT_PROFILE_ID,
    fullName: legacyProfile?.fullName || latestResume?.data.fullName || "پروفایل اصلی",
    targetTitle: legacyProfile?.targetTitle || latestResume?.data.jobTitle || "",
    createdAt: legacyProfile?.createdAt ?? now,
    updatedAt: now,
  };
  await appProfileStore.put(profile);
  await setActiveProfileId(profile.id);
  return [profile];
}

function createStore<T extends { id: string; createdAt: string; updatedAt: string; profileId?: string }>(collection: DataCollection) {
  return {
    async list() {
      const [records, profileId] = await Promise.all([
        getDataRepository().list<T>(collection),
        getActiveProfileId(),
      ]);
      return records
        .filter((record) => record.profileId === profileId || (!record.profileId && profileId === DEFAULT_PROFILE_ID))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async get(id: string) {
      const profileId = await getActiveProfileId();
      const record = await getDataRepository().get<T>(collection, id);
      if (record && (record.profileId === profileId || (!record.profileId && profileId === DEFAULT_PROFILE_ID))) return record;
      if (profileId === DEFAULT_PROFILE_ID && id === DEFAULT_PROFILE_ID) {
        return getDataRepository().get<T>(collection, "current-user");
      }
      return undefined;
    },
    async put(record: T) {
      const profileId = await getActiveProfileId();
      return getDataRepository().put(collection, { ...record, profileId });
    },
    async remove(id: string) {
      const record = await this.get(id);
      if (record) await getDataRepository().remove(collection, id);
    },
    async clear() {
      const records = await this.list();
      await Promise.all(records.map((record) => getDataRepository().remove(collection, record.id)));
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
export const knowledgeProfileStore = createStore<KnowledgeProfileRecord>("knowledgeProfiles");
export const resumeStore = createStore<ResumeRecord>("resumes");
export const jobStore = createStore<JobRecord>("jobs");
export const applicationStore = createStore<ApplicationRecord>("applications");
export const interviewSessionStore = createStore<InterviewSessionRecord>("interviewSessions");
export const matchAnalysisStore = createStore<MatchAnalysisRecord>("matchAnalyses");
export const dashboardSnapshotStore = createStore<DashboardSnapshotRecord>("dashboardSnapshots");

export async function getLatestResume() {
  return (await resumeStore.list())[0];
}
