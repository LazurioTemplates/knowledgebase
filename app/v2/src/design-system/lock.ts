import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// The knowledge base takes its look from a design system as a reviewed copy
// with a lock, never by reading another repository at run time (Lazurio Module
// Standard, Boundaries; LazurioTemplates/design-system, docs/extending.md).
// src/design-system/lock.json names the design system's repository, the
// release and its commit, the files copied unchanged with their SHA-256, and
// the files the knowledge base adapted as its own code with the SHA-256 of
// their source, so that a sync shows which of them changed. The shape is the
// one the other Marketplace templates built on the design system use.

export type CopiedFile = { from: string; to: string; sha256: string };
export type AdaptedFile = { from: string; to: string; sourceSha256: string };
export type DesignSystemLock = {
  source: string;
  ref: string;
  commit: string;
  copied: CopiedFile[];
  adapted: AdaptedFile[];
};

export const LOCK_PATH = "src/design-system/lock.json";
export const TOKENS_FROM = "content/brand/colors/tokens.json";
const REPOSITORY = /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
const COMMIT = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
// A path inside a repository or the App: forward slashes, no way out of it.
const PATH = /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))[A-Za-z0-9._/-]+$/;

export const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

export function parseLock(value: unknown): DesignSystemLock {
  const fail = (message: string): never => {
    throw new Error(`${LOCK_PATH}: ${message}`);
  };
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail("must be an object");
  }
  const lock = value as Record<string, unknown>;
  if (Object.keys(lock).sort().join(",") !== "adapted,commit,copied,ref,source") {
    fail("has exactly source, ref, commit, copied and adapted");
  }
  if (typeof lock.source !== "string" || !REPOSITORY.test(lock.source)) {
    fail("source is https://github.com/<owner>/<repository>");
  }
  if (typeof lock.ref !== "string" || lock.ref.length === 0) fail("ref names a tag or commit");
  if (typeof lock.commit !== "string" || !COMMIT.test(lock.commit)) {
    fail("commit is a full 40-character commit");
  }
  const files = (name: "copied" | "adapted", hash: "sha256" | "sourceSha256") => {
    const list = lock[name];
    if (!Array.isArray(list)) return fail(`${name} is a list`);
    for (const [index, file] of list.entries()) {
      const f = (file ?? {}) as Record<string, unknown>;
      const valid =
        typeof f.from === "string" &&
        PATH.test(f.from) &&
        typeof f.to === "string" &&
        PATH.test(f.to) &&
        typeof f[hash] === "string" &&
        SHA256.test(f[hash] as string) &&
        Object.keys(f).length === 3;
      if (!valid) fail(`${name}[${index}] has from, to (relative paths) and ${hash} (SHA-256)`);
    }
    return list;
  };
  const copied = files("copied", "sha256") as CopiedFile[];
  if (!copied.some((file) => file.from === TOKENS_FROM)) {
    fail(`copied names the design system's ${TOKENS_FROM}`);
  }
  return {
    source: lock.source as string,
    ref: lock.ref as string,
    commit: lock.commit as string,
    copied,
    adapted: files("adapted", "sourceSha256") as AdaptedFile[],
  };
}

export function readLock(app: string): DesignSystemLock {
  return parseLock(JSON.parse(readFileSync(join(app, LOCK_PATH), "utf8")));
}

/** The App's copy of the tokens, as the lock names it. */
export function tokensCopy(lock: DesignSystemLock): CopiedFile {
  return lock.copied.find((file) => file.from === TOKENS_FROM) as CopiedFile;
}

/** How the generated files name their source. */
export function describeSource(lock: DesignSystemLock): string {
  return `${lock.source.replace("https://github.com/", "")} ${lock.ref}, ${TOKENS_FROM}`;
}
