export function shouldPersistStoredState({
  hasLoadedStoredState,
  skipNextPersist,
}: {
  hasLoadedStoredState: boolean;
  skipNextPersist: boolean;
}) {
  return hasLoadedStoredState && !skipNextPersist;
}
