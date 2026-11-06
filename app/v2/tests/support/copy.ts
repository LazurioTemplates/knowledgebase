import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Copies of the module for tests that change data/v2 (the empty start, the
// language) or build another language, so that the repository itself is never
// changed by a test.
export const appDir = resolve(import.meta.dir, "../..");
export const dataDir = resolve(appDir, "../../data/v2");

/** A temporary directory, its real path (on Windows tmpdir() may be an 8.3
 * short path). */
export function scratchDirectory(prefix: string): string {
  return mkdtempSync(join(realpathSync.native(tmpdir()), prefix));
}

/** A copy of data/v2 alone. */
export function copyData(): string {
  const copy = scratchDirectory("kb-data-");
  cpSync(dataDir, copy, { recursive: true });
  return copy;
}

/** A copy of the module's App and data with the language the App shows set
 * to `language`, its dependencies installed from the lock file (Bun's cache
 * makes it quick and needs no network once the App is installed). A link to
 * the App's own node_modules does not do: Astro then loses the paths of the
 * components it compiles. */
export function copyModule(language: string): { root: string; app: string; data: string } {
  const root = scratchDirectory("kb-module-");
  const app = join(root, "app/v2");
  const data = join(root, "data/v2");
  mkdirSync(app, { recursive: true });
  const skip = new Set(["node_modules", "dist", ".astro"]);
  cpSync(appDir, app, {
    recursive: true,
    filter: (source) => !skip.has(source.slice(appDir.length + 1).split(/[\\/]/)[0] ?? ""),
  });
  const install = Bun.spawnSync([process.execPath, "install", "--frozen-lockfile"], {
    cwd: app,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (install.exitCode !== 0) throw new Error(`bun install failed: ${install.stderr.toString()}`);
  cpSync(dataDir, data, { recursive: true });
  const declaration = JSON.parse(readFileSync(join(data, "knowledgebase.json"), "utf8"));
  declaration.language = language;
  writeFileSync(join(data, "knowledgebase.json"), `${JSON.stringify(declaration, null, 2)}\n`);
  return { root, app, data };
}

export function remove(path: string) {
  if (path) rmSync(path, { recursive: true, force: true });
}
