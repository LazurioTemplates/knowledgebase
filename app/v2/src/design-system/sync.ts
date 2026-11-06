import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { app, writeGenerated } from "./generate";
import { type DesignSystemLock, LOCK_PATH, readLock, sha256 } from "./lock";
import { parseThemeTokens } from "./theme";

// Refreshes the knowledge base's copy of the design system from a checkout of
// a design system repository at a tag or commit, rewrites the lock and the
// theme:
//
//   bun run design-system:sync -- <design system checkout> <tag or commit> [--source <url>]
//
// Point it at the Organization's own design system (an adoption of
// LazurioTemplates/design-system, the same tokens.json shape) and the
// knowledge base takes its colours and type; point it at a newer release of
// the template (v2.0.0) to take that. It reads the files from the commit, not
// from the working tree, copies the files of `copied` exactly after checking
// that the tokens parse, and lists the files of `adapted` whose source changed:
// those are the knowledge base's own code, ported by hand with the diff it
// prints, in the same pull request. It writes nothing when the tag, a file or
// the tokens are wrong. Nothing is fetched.

export type SyncReport = {
  lock: DesignSystemLock;
  previous: { source: string; commit: string };
  changed: { from: string; to: string }[];
  missing: { from: string; to: string }[];
};

function git(checkout: string, args: string[]): { ok: boolean; out: Uint8Array; err: string } {
  const run = Bun.spawnSync(["git", "-C", checkout, ...args], { stdout: "pipe", stderr: "pipe" });
  return { ok: run.exitCode === 0, out: run.stdout, err: run.stderr.toString().trim() };
}

/** https://github.com/<owner>/<repository> from the forms a GitHub remote takes. */
export function repositoryUrl(remote: string): string | null {
  const match =
    /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?$/.exec(
      remote.trim(),
    );
  return match ? `https://github.com/${match[1]}/${match[2]}` : null;
}

export function syncDesignSystem(options: {
  app: string;
  checkout: string;
  ref: string;
  source?: string | undefined;
}): SyncReport {
  const { checkout, ref } = options;
  const before = readLock(options.app);
  const resolved = git(checkout, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  if (!resolved.ok) throw new Error(`${ref} is no tag or commit in ${checkout}`);
  const commit = resolved.out.toString().trim();
  const origin = git(checkout, ["remote", "get-url", "origin"]);
  const source = repositoryUrl(options.source ?? (origin.ok ? origin.out.toString() : ""));
  if (source === null) {
    throw new Error(
      "The checkout has no GitHub origin; name the design system's repository with --source https://github.com/<owner>/<repository>",
    );
  }
  const blob = (path: string): Uint8Array | null => {
    const run = git(checkout, ["show", `${commit}:${path}`]);
    return run.ok ? run.out : null;
  };

  // Read and check everything first, then write.
  const copies = before.copied.map((file) => {
    const bytes = blob(file.from);
    if (bytes === null) throw new Error(`${file.from} is not in ${source} at ${commit}`);
    if (file.from.endsWith("tokens.json")) {
      parseThemeTokens(JSON.parse(new TextDecoder().decode(bytes)));
    }
    return { ...file, bytes, sha256: sha256(bytes) };
  });
  const changed: SyncReport["changed"] = [];
  const missing: SyncReport["missing"] = [];
  const adapted = before.adapted.map((file) => {
    const bytes = blob(file.from);
    if (bytes === null) {
      missing.push({ from: file.from, to: file.to });
      return file;
    }
    const sourceSha256 = sha256(bytes);
    if (sourceSha256 !== file.sourceSha256) changed.push({ from: file.from, to: file.to });
    return { ...file, sourceSha256 };
  });

  for (const copy of copies) {
    const target = join(options.app, copy.to);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, copy.bytes);
  }
  const lock: DesignSystemLock = {
    source,
    ref,
    commit,
    copied: copies.map(({ from, to, sha256 }) => ({ from, to, sha256 })),
    adapted,
  };
  writeFileSync(join(options.app, LOCK_PATH), `${JSON.stringify(lock, null, 2)}\n`);
  return { lock, previous: { source: before.source, commit: before.commit }, changed, missing };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const at = args.indexOf("--source");
  const source = at >= 0 ? args[at + 1] : undefined;
  const [checkout, ref] = args.filter((_, i) => at < 0 || (i !== at && i !== at + 1));
  if (!checkout || !ref) {
    console.error(
      "usage: bun run design-system:sync -- <design system checkout> <tag or commit> [--source <url>]",
    );
    process.exit(2);
  }
  try {
    const report = syncDesignSystem({ app, checkout: resolve(checkout), ref, source });
    const { lock, previous } = report;
    console.log(
      `Copied ${lock.copied.map((f) => f.to).join(", ")} from ${lock.source} at ${lock.commit}.`,
    );
    console.log(`Theme and favicon written from ${writeGenerated()}.`);
    for (const file of report.changed) {
      console.log(`Changed at the source, port it by hand: ${file.from} -> ${file.to}`);
    }
    for (const file of report.missing) {
      console.log(`Not in the design system any more, keep or remove: ${file.from} -> ${file.to}`);
    }
    if (report.changed.length > 0 && previous.source === lock.source) {
      const paths = report.changed.map((f) => f.from).join(" ");
      console.log(
        `See what changed: git -C ${checkout} diff ${previous.commit} ${lock.commit} -- ${paths}`,
      );
    }
    console.log("Next: bun run check, then look at the knowledge base in a browser.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
