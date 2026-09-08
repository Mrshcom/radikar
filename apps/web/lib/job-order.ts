export function prioritizeSavedJobs<T extends { saved?: boolean }>(
  jobs: readonly T[],
) {
  return [...jobs].sort(
    (first, second) =>
      Number(Boolean(second.saved)) - Number(Boolean(first.saved)),
  );
}
