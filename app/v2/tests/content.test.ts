import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { contentProblems, readContent } from "../src/content-check";
import { internalLinks, splitFrontmatter } from "../src/pages";

// The content contract of the knowledge base (data/v2): every page has a title,
// lives in a declared section under a clean name, links to pages that exist
// (an Organization's own page never to an example), and the glossary and the
// decisions keep their rules. A problem names the page and what to do.
const dataRoot = resolve(import.meta.dir, "../../../data/v2");
const content = readContent(dataRoot);

describe("knowledge base content", () => {
  test("has the home page and an overview in every section", () => {
    const slugs = new Set(content.pages.map((page) => page.slug));
    expect(slugs.has("")).toBe(true);
    for (const section of content.structure.sections) {
      expect(slugs.has(section.directory), section.directory).toBe(true);
    }
  });

  test("breaks no rule", () => {
    expect(contentProblems(content)).toEqual([]);
  });
});

describe("the rules find what breaks them", () => {
  const page = (path: string, frontmatter: Record<string, unknown>, body = "") => ({
    path,
    slug: path.replace(/\.md$/, "").replace(/\/?index$/, ""),
    frontmatter,
    body,
  });
  const withPages = (...extra: ReturnType<typeof page>[]) =>
    contentProblems({ ...content, pages: [...content.pages, ...extra] });

  test("a page without a title, outside a section or with an unclean name", () => {
    expect(withPages(page("procesy/bez-nazvu.md", {}))).toEqual([
      "procesy/bez-nazvu.md: the frontmatter has no title",
    ]);
    expect(withPages(page("jinde/stranka.md", { title: "X" }))).toEqual([
      "jinde/stranka.md: a page lives directly in a section of knowledgebase.json",
    ]);
    expect(withPages(page("procesy/Nový_Postup.md", { title: "X" }))[0]).toContain(
      "lowercase ASCII",
    );
  });

  test("a broken or relative link, and a link from own content to an example", () => {
    const [sample] = content.pages.filter((p) => p.frontmatter.sample === true);
    const problems = withPages(
      page("procesy/odkazy.md", { title: "X" }, "[a](/neexistuje/) [b](../procesy/)"),
      ...(sample ? [page("procesy/vlastni.md", { title: "Y" }, `[c](/${sample.slug}/)`)] : []),
    );
    expect(problems).toContain(
      "procesy/odkazy.md: the link /neexistuje/ leads to no page and no file of public/",
    );
    expect(problems.some((p) => p.includes('link "../procesy/" from the site root'))).toBe(true);
    if (sample)
      expect(problems.some((p) => p.startsWith("procesy/vlastni.md: links to the example"))).toBe(
        true,
      );
  });

  test("a decision without its number, date or author, or superseded wrongly", () => {
    const problems = withPages(
      page("rozhodnuti/bez-cisla.md", { title: "X", status: "current" }),
      page("rozhodnuti/0099-nahrazene.md", {
        title: "Y",
        status: "current",
        decided: "2026-01-01",
        decided_by: "Vedení",
        superseded_by: "rozhodnuti/0100-neni",
      }),
    );
    expect(problems).toEqual([
      "rozhodnuti/bez-cisla.md: a decision is named <number>-<short-name>.md, e.g. 0002-...",
      "rozhodnuti/bez-cisla.md: a decision says when (decided) and who (decided_by) decided",
      "rozhodnuti/0099-nahrazene.md: superseded_by names no decision page (rozhodnuti/0100-neni)",
      "rozhodnuti/0099-nahrazene.md: a superseded decision has status: outdated",
    ]);
  });

  test("a glossary term that is already there under another name", () => {
    const problems = withPages(
      page("slovnik/a.md", { title: "Zakázka", aliases: ["projekt"] }),
      page("slovnik/b.md", { title: "Projekt" }),
    );
    expect(problems).toEqual(['slovnik/b.md: the term "Projekt" is already in slovnik/a.md']);
  });
});

describe("reading pages", () => {
  test("frontmatter and links", () => {
    const { frontmatter, body } = splitFrontmatter("---\ntitle: A\naliases: [b, c]\n---\n\nText");
    expect(frontmatter).toEqual({ title: "A", aliases: ["b", "c"] });
    expect(body).toBe("\nText");
    expect(
      internalLinks("[a](/x/) [b](https://e.example/) [c](#k) `[d](/code/)` [e](/y/#k)"),
    ).toEqual(["/x/", "/y/"]);
  });
});
