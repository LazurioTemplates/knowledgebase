import { afterEach, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { contentProblems, readContent } from "../src/content-check";

// The empty start (`bun run start:empty`) on a copy of data/v2: the examples
// go, the structure stays and still holds every rule.
const app = resolve(import.meta.dir, "..");
const dataRoot = resolve(app, "../../data/v2");
const script = join(app, "src/cli/empty-start.ts");
let copy = "";

function freshCopy(): string {
  // realpathSync.native: on Windows tmpdir() may be an 8.3 short path.
  copy = mkdtempSync(join(realpathSync.native(tmpdir()), "kb-empty-start-"));
  cpSync(dataRoot, copy, { recursive: true });
  return copy;
}

function run(...args: string[]) {
  return Bun.spawnSync([process.execPath, script, ...args], { stdout: "pipe", stderr: "pipe" });
}

afterEach(() => {
  if (copy) rmSync(copy, { recursive: true, force: true });
  copy = "";
});

describe("empty start", () => {
  test("removes every example and keeps a structure that holds", () => {
    const data = freshCopy();
    const before = readContent(data).pages.filter((page) => page.frontmatter.sample === true);
    const result = run("--data", data);
    expect(result.exitCode, result.stderr.toString()).toBe(0);
    const after = readContent(data);
    expect(after.pages.filter((page) => page.frontmatter.sample === true)).toEqual([]);
    for (const page of before) expect(existsSync(join(data, "docs", page.path))).toBe(false);
    for (const section of after.structure.sections) {
      expect(existsSync(join(data, "docs", section.directory, "index.md"))).toBe(true);
    }
    expect(contentProblems(after)).toEqual([]);
  });

  test("a dry run removes nothing", () => {
    const data = freshCopy();
    const before = readContent(data).pages.length;
    expect(run("--data", data, "--dry-run").exitCode).toBe(0);
    expect(readContent(data).pages.length).toBe(before);
  });

  test("refuses while an own page links to an example", () => {
    const data = freshCopy();
    const sample = readContent(data).pages.find((page) => page.frontmatter.sample === true);
    if (!sample) return;
    const own = join(data, "docs", "procesy", "vlastni-postup.md");
    writeFileSync(own, `---\ntitle: Vlastní postup\n---\n\nViz [ukázka](/${sample.slug}/).\n`);
    const result = run("--data", data);
    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain("procesy/vlastni-postup.md");
    expect(existsSync(join(data, "docs", sample.path))).toBe(true);
  });
});
