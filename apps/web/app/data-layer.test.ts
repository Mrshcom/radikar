import { afterEach, describe, expect, it, vi } from "vitest";

const repository = { list: vi.fn(), get: vi.fn(), put: vi.fn(), remove: vi.fn(), clear: vi.fn() };

vi.mock("@/lib/data/repository", () => ({ getDataRepository: () => repository }));

describe("data repository and scoped stores", () => {
  afterEach(() => { vi.clearAllMocks(); vi.resetModules(); });

  it("scopes records to the active workspace and removes every workspace record", async () => {
    const { jobStore, removeWorkspace, setActiveProfileId, ensureDefaultAppProfile } = await import("@/lib/data/stores");
    const now = "2026-01-01T00:00:00.000Z";
    repository.get.mockResolvedValue({ id: "active-profile", activeProfileId: "p2", createdAt: now, updatedAt: now });
    repository.list.mockImplementation(async (collection: string) => collection === "appProfiles" ? [{ id: "p2", workspaceName: "Team", createdAt: now, updatedAt: now }] : [{ id: "own", profileId: "p2", createdAt: now, updatedAt: now }, { id: "other", profileId: "p3", createdAt: now, updatedAt: now }]);
    await expect(jobStore.list()).resolves.toEqual([{ id: "own", profileId: "p2", createdAt: now, updatedAt: now }]);
    await jobStore.put({ id: "new", createdAt: now, updatedAt: now, company: "شرکت", role: "توسعه‌دهنده", match: 80, place: "تهران", age: "امروز", tone: "green", letter: "", description: "شرح", saved: false });
    expect(repository.put).toHaveBeenCalledWith("jobs", expect.objectContaining({ profileId: "p2" }));
    await removeWorkspace("p2");
    expect(repository.remove).toHaveBeenCalledWith("jobs", "own");
    expect(repository.remove).toHaveBeenCalledWith("appProfiles", "p2");
    await setActiveProfileId("p3");
    expect(repository.put).toHaveBeenCalledWith("workspaceState", expect.objectContaining({ activeProfileId: "p3" }));
    await expect(ensureDefaultAppProfile()).resolves.toHaveLength(1);
  });

  it("migrates legacy profiles, keeps profiles isolated and never removes another workspace", async () => {
    const { ensureDefaultAppProfile, jobStore, removeWorkspace, setActiveProfileId } = await import("@/lib/data/stores");
    const now = "2026-01-01T00:00:00.000Z";
    repository.list.mockImplementation(async (collection: string) => {
      if (collection === "appProfiles") return [{ id: "profile-default", fullName: "سارا", targetTitle: "Dev", workspaceName: "فضای کاری اصلی", createdAt: now, updatedAt: now }];
      return [{ id: "legacy", createdAt: now, updatedAt: now }, { id: "p2", profileId: "p2", createdAt: now, updatedAt: now }, { id: "foreign", profileId: "p3", createdAt: now, updatedAt: now }];
    });
    repository.get.mockResolvedValue({ id: "active-profile", activeProfileId: "profile-default", createdAt: now, updatedAt: now });
    await expect(ensureDefaultAppProfile()).resolves.toEqual([expect.objectContaining({ workspaceName: "فضای کاری شخصی" })]);
    expect(repository.put).toHaveBeenCalledWith("appProfiles", expect.not.objectContaining({ fullName: expect.anything() }));
    await expect(jobStore.list()).resolves.toEqual([expect.objectContaining({ id: "legacy" })]);
    await setActiveProfileId("p2");
    repository.get.mockResolvedValue({ id: "active-profile", activeProfileId: "p2", createdAt: now, updatedAt: now });
    await expect(jobStore.list()).resolves.toEqual([expect.objectContaining({ id: "p2" })]);
    await removeWorkspace("p2");
    expect(repository.remove).toHaveBeenCalledWith("jobs", "p2");
    expect(repository.remove).not.toHaveBeenCalledWith("jobs", "foreign");
  });

  it("does not leak or delete data when repository operations fail", async () => {
    const { jobStore, removeWorkspace } = await import("@/lib/data/stores");
    const now = "2026-01-01T00:00:00.000Z";
    repository.get.mockResolvedValue({ id: "active-profile", activeProfileId: "p2", createdAt: now, updatedAt: now });
    repository.list.mockResolvedValue([{ id: "p3-only", profileId: "p3", createdAt: now, updatedAt: now }]);
    await expect(jobStore.get("p3-only")).resolves.toBeUndefined();
    repository.list.mockRejectedValueOnce(new Error("offline"));
    await expect(removeWorkspace("p2")).rejects.toThrow("offline");
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
