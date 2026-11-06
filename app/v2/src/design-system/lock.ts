import { createHash } from "node:crypto";

// design-system.lock.json: where the snapshot of the design system's tokens
// comes from. The snapshot is never edited by hand; a refresh replaces it and
// the lock together (`bun run design-system:refresh <checkout>`).
export type DesignSystemLock = Readonly<{
  schema_version: "lazurio.knowledgebase.design-system-lock.v1";
  /** owner/name on GitHub of the design system the snapshot comes from. */
  repository: string;
  /** The release tag of the commit, or null when the commit has none. */
  ref: string | null;
  commit: string;
  /** The tokens file in the design system's repository. */
  path: string;
  /** The snapshot beside the lock. */
  snapshot: "tokens.json";
  sha256: string;
}>;

const REPOSITORY = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9._-]+$/;

export function parseLock(value: unknown): DesignSystemLock {
  if (typeof value !== "object" || value === null) throw new Error("lock must be an object");
  const lock = value as Record<string, unknown>;
  if (lock.schema_version !== "lazurio.knowledgebase.design-system-lock.v1") {
    throw new Error("lock.schema_version is not lazurio.knowledgebase.design-system-lock.v1");
  }
  if (typeof lock.repository !== "string" || !REPOSITORY.test(lock.repository)) {
    throw new Error("lock.repository must be owner/name");
  }
  if (lock.ref !== null && (typeof lock.ref !== "string" || lock.ref === "")) {
    throw new Error("lock.ref must be a tag or null");
  }
  if (typeof lock.commit !== "string" || !/^[0-9a-f]{40}$/.test(lock.commit)) {
    throw new Error("lock.commit must be a full commit");
  }
  if (typeof lock.path !== "string" || !lock.path.endsWith(".json")) {
    throw new Error("lock.path must name the tokens file");
  }
  if (lock.snapshot !== "tokens.json") throw new Error("lock.snapshot must be tokens.json");
  if (typeof lock.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(lock.sha256)) {
    throw new Error("lock.sha256 must be a SHA-256 in hex");
  }
  return lock as DesignSystemLock;
}

export function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** How the generated files name their source. */
export function describeSource(lock: DesignSystemLock): string {
  return `${lock.repository} ${lock.ref ?? lock.commit.slice(0, 12)}, ${lock.path}`;
}
