import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { contentProblems, readContent } from "../src/content-check";
import { languagesOf, loadDeclaration, sectionOf } from "../src/structure";
import { appDir, copyData, dataDir, remove } from "./support/copy";

// The starts on a copy of data/v2: the empty start removes the examples in
// every language and keeps a structure that holds every rule; the language
// start keeps one language and removes the others.
let copy = "";
afterEach(() => {
  remove(copy);
  copy = "";
});

function run(script: string, ...args: string[]) {
  return Bun.spawnSync([process.execPath, join(appDir, "src/cli", script), ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
}

describe("empty start", () => {
  test("removes every example in every language and keeps a structure that holds", () => {
    copy = copyData();
    const result = run("empty-start.ts", "--data", copy);
    expect(result.exitCode, result.stderr.toString()).toBe(0);
    for (const language of languagesOf(copy)) {
      const after = readContent(copy, language);
      expect(after.pages.filter((page) => page.frontmatter.sample === true)).toEqual([]);
      for (const section of after.structure.sections) {
        expect(
          existsSync(join(copy, after.structure.content_root, section.directory, "index.md")),
        ).toBe(true);
      }
      expect(contentProblems(after)).toEqual([]);
    }
  });

  test("a dry run removes nothing", () => {
    copy = copyData();
    const before = readContent(copy).pages.length;
    expect(run("empty-start.ts", "--data", copy, "--dry-run").exitCode).toBe(0);
    expect(readContent(copy).pages.length).toBe(before);
  });

  for (const [form, link] of [
    ["an inline link", (slug: string) => `See [the example](/${slug}/).`],
    ["a reference link", (slug: string) => `See [the example][ex].\n\n[ex]: /${slug}/`],
    [
      "a reference link whose definition has its destination on the next line",
      (slug: string) => `See [example][ex].\n\n[ex]:\n  /${slug}/`,
    ],
    ["a reference image", (slug: string) => `![the example][ex]\n\n[ex]: /${slug}/`],
    ["an HTML link", (slug: string) => `See <a href="/${slug}/">the example</a>.`],
  ] as const) {
    test(`refuses while an own page links to an example by ${form}`, () => {
      copy = copyData();
      const content = readContent(copy);
      const sample = content.pages.find((page) => page.frontmatter.sample === true);
      if (!sample) return;
      const processes = sectionOf(content.structure, "processes").directory;
      const own = join(copy, content.structure.content_root, processes, "own-procedure.md");
      writeFileSync(own, `---\ntitle: Own\n---\n\n${link(sample.slug)}\n`);
      const result = run("empty-start.ts", "--data", copy);
      expect(result.exitCode).toBe(1);
      expect(result.stderr.toString()).toContain(`${processes}/own-procedure.md`);
      expect(existsSync(join(copy, content.structure.content_root, sample.path))).toBe(true);
    });
  }
});

describe("language start", () => {
  for (const language of languagesOf(dataDir)) {
    test(`keeps ${language} only, and the knowledge base shows it`, () => {
      copy = copyData();
      const others = languagesOf(copy).filter((other) => other !== language);
      const result = run("start-language.ts", language, "--data", copy);
      expect(result.exitCode, result.stderr.toString()).toBe(0);
      const declaration = loadDeclaration(copy);
      expect(declaration.language).toBe(language);
      expect(Object.keys(declaration.languages)).toEqual([language]);
      for (const other of others) expect(existsSync(join(copy, "docs", other))).toBe(false);
      expect(contentProblems(readContent(copy))).toEqual([]);
      expect(readFileSync(join(copy, "knowledgebase.json"), "utf8")).toEndWith("}\n");
    });
  }

  test("refuses a language Lazurio does not have", () => {
    copy = copyData();
    expect(run("start-language.ts", "de", "--data", copy).exitCode).toBe(2);
  });
});
