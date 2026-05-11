import type { IsolationPolicy, SessionMode } from "@veil/types";

export function createIsolationPolicy(
  workspaceId: string,
  mode: SessionMode,
): IsolationPolicy {
  return {
    container: true,
    disposableStorage: mode !== "persistent",
    cookiePartition: `workspace-${workspaceId}`,
    memoryMb: mode === "developer" ? 2048 : 1024,
    cpuShares: mode === "developer" ? 1024 : 512,
    egressPolicy: mode === "temporary" ? "restricted" : "standard",
  };
}
