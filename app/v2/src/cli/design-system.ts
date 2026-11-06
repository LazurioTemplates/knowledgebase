// The snapshot of the design system's tokens and what is generated from it.
//
//   bun run theme:write
//       Writes src/styles/theme.css and data/v2/public/favicon.svg from the
//       snapshot after checking it against its lock.
//   bun run design-system:refresh <checkout> [--repository owner/name] [--path <file>]
//       Copies the tokens file from a clean checkout of the Organization's
//       design system at the commit it is on, records the repository, the
//       commit, its tag and the SHA-256 in the lock, and writes the theme.
//       Nothing is fetched: the checkout is the reviewed source.
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { type DesignSystemLock, describeSource, parseLock, sha256 } from "../design-system/lock";
import { faviconSvg, parseThemeTokens, themeStylesheet } from "../design-system/theme";

const app = resolve(import.meta.dir, "../..");
export const paths = {
  tokens: join(app, "src/design-system/tokens.json"),
  lock: join(app, "src/design-system/design-system.lock.json"),
  theme: join(app, "src/styles/theme.css"),
  favicon: join(app, "../../data/v2/public/favicon.svg"),
};

/** What the snapshot generates: the stylesheet and the favicon. Throws when
 * the snapshot is not the one its lock names. */
export function generate(tokensBytes: string, lock: DesignSystemLock) {
  if (sha256(tokensBytes) !== lock.sha256) {
    throw new Error(
      "src/design-system/tokens.json does not match the SHA-256 of its lock; refresh the snapshot instead of editing it",
    );
  }
  const tokens = parseThemeTokens(JSON.parse(tokensBytes));
  return { theme: themeStylesheet(tokens, describeSource(lock)), favicon: faviconSvg(tokens) };
}

/** owner/name from a GitHub remote URL (https or SSH). */
export function repositoryOf(remote: string): string | null {
  const match = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(remote.trim());
  return match ? `${match[1]}/${match[2]}` : null;
}

function git(checkout: string, ...args: string[]): string | null {
  const run = Bun.spawnSync(["git", "-C", checkout, ...args], { stdout: "pipe", stderr: "pipe" });
  return run.exitCode === 0 ? run.stdout.toString().trim() : null;
}

function write() {
  const lock = parseLock(JSON.parse(readFileSync(paths.lock, "utf8")));
  const { theme, favicon } = generate(readFileSync(paths.tokens, "utf8"), lock);
  writeFileSync(paths.theme, theme);
  writeFileSync(paths.favicon, favicon);
  console.log(`theme written from ${describeSource(lock)}`);
}

function refresh(checkoutArg: string | undefined, repository?: string, file?: string) {
  if (!checkoutArg)
    throw new Error("usage: bun run design-system:refresh <checkout of the design system>");
  const checkout = resolve(checkoutArg);
  const current = parseLock(JSON.parse(readFileSync(paths.lock, "utf8")));
  const path = file ?? current.path;
  const commit = git(checkout, "rev-parse", "HEAD");
  if (!commit) throw new Error(`${checkout} is not a Git checkout`);
  if (git(checkout, "status", "--porcelain", "--", path) !== "") {
    throw new Error(`${path} has uncommitted changes in ${checkout}; refresh from a commit`);
  }
  const owner = repository ?? repositoryOf(git(checkout, "remote", "get-url", "origin") ?? "");
  if (!owner)
    throw new Error("the checkout has no GitHub origin; name it with --repository owner/name");
  const bytes = readFileSync(join(checkout, path), "utf8");
  parseThemeTokens(JSON.parse(bytes));
  const lock = parseLock({
    schema_version: "lazurio.knowledgebase.design-system-lock.v1",
    repository: owner,
    ref: git(checkout, "describe", "--tags", "--exact-match", "HEAD"),
    commit,
    path,
    snapshot: "tokens.json",
    sha256: sha256(bytes),
  });
  writeFileSync(paths.tokens, bytes);
  writeFileSync(paths.lock, `${JSON.stringify(lock, null, 2)}\n`);
  console.log(`snapshot refreshed from ${describeSource(lock)} (${commit})`);
  write();
}

if (import.meta.main) {
  const { positionals, values } = parseArgs({
    args: Bun.argv.slice(2),
    allowPositionals: true,
    options: { repository: { type: "string" }, path: { type: "string" } },
  });
  const [command, checkout] = positionals;
  try {
    if (command === "write") write();
    else if (command === "refresh") refresh(checkout, values.repository, values.path);
    else throw new Error("usage: design-system.ts write | refresh <checkout>");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
