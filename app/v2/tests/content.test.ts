import { describe, expect, test } from "bun:test";
import { contentProblems, readContent } from "../src/content-check";
import { internalLinks, splitFrontmatter } from "../src/pages";
import { languagesOf, sectionOf } from "../src/structure";
import { dataDir } from "./support/copy";

// The content contract of the knowledge base (data/v2), for the pages of each
// language on their own: every page has a title, lives in a declared section
// under a clean name, links to pages that exist (an Organization's own page
// never to an example), and the glossary and the decisions keep their rules.
// A problem names the page and what to do.
const languages = languagesOf(dataDir);

describe("knowledge base content", () => {
  for (const language of languages) {
    const content = readContent(dataDir, language);

    test(`${language}: has the home page and an overview in every section`, () => {
      const slugs = new Set(content.pages.map((page) => page.slug));
      expect(slugs.has("")).toBe(true);
      for (const section of content.structure.sections) {
        expect(slugs.has(section.directory), section.directory).toBe(true);
      }
    });

    test(`${language}: breaks no rule`, () => {
      expect(contentProblems(content)).toEqual([]);
    });
  }
});

describe("the rules find what breaks them", () => {
  const content = readContent(dataDir, languages[0]);
  const lang = content.structure.language;
  const dir = (kind: Parameters<typeof sectionOf>[1]) =>
    sectionOf(content.structure, kind).directory;
  const processes = dir("processes");
  const decisions = dir("decisions");
  const glossary = dir("glossary");
  const page = (path: string, frontmatter: Record<string, unknown>, body = "") => ({
    path,
    slug: path.replace(/\.md$/, "").replace(/\/?index$/, ""),
    frontmatter,
    body,
  });
  const withPages = (...extra: ReturnType<typeof page>[]) =>
    contentProblems({ ...content, pages: [...content.pages, ...extra] });

  test("a page without a title, outside a section or with an unclean name", () => {
    expect(withPages(page(`${processes}/no-title.md`, {}))).toEqual([
      `${lang}/${processes}/no-title.md: the frontmatter has no title`,
    ]);
    expect(withPages(page("elsewhere/page.md", { title: "X" }))).toEqual([
      `${lang}/elsewhere/page.md: a page lives directly in a section of knowledgebase.json`,
    ]);
    expect(withPages(page(`${processes}/New_Page.md`, { title: "X" }))[0]).toContain(
      "lowercase ASCII",
    );
  });

  test("a broken or relative link, and a link from own content to an example", () => {
    const sample = content.pages.find((p) => p.frontmatter.sample === true);
    const problems = withPages(
      page(`${processes}/links.md`, { title: "X" }, `[a](/missing/) [b](../${processes}/)`),
      ...(sample ? [page(`${processes}/own.md`, { title: "Y" }, `[c](/${sample.slug}/)`)] : []),
    );
    expect(problems).toContain(
      `${lang}/${processes}/links.md: the link /missing/ leads to no page and no file of public/`,
    );
    expect(problems.some((p) => p.includes(`link "../${processes}/" from the site root`))).toBe(
      true,
    );
    if (sample) {
      expect(
        problems.some((p) => p.startsWith(`${lang}/${processes}/own.md: links to the example`)),
      ).toBe(true);
    }
  });

  test("a reference link to an example or to no page is found like an inline one", () => {
    const sample = content.pages.find((p) => p.frontmatter.sample === true);
    if (!sample) return;
    const problems = withPages(
      page(
        `${processes}/references.md`,
        { title: "X" },
        `See [the example][ex], [Gone][] and [short].\n\n[ex]: /${sample.slug}/\n[gone]: /missing/ "Title"\n> [short]: </also-missing/>\n`,
      ),
    );
    expect(problems).toEqual([
      `${lang}/${processes}/references.md: links to the example /${sample.slug}/; the empty start would break the link`,
      `${lang}/${processes}/references.md: the link /missing/ leads to no page and no file of public/`,
      `${lang}/${processes}/references.md: the link /also-missing/ leads to no page and no file of public/`,
    ]);
  });

  test("an HTML link or image to no page or file is found", () => {
    const problems = withPages(
      page(
        `${processes}/html.md`,
        { title: "X" },
        `<a href="/missing/">x</a> <img src='/nothing.png'>`,
      ),
    );
    expect(problems).toEqual([
      `${lang}/${processes}/html.md: the link /missing/ leads to no page and no file of public/`,
      `${lang}/${processes}/html.md: the link /nothing.png leads to no page and no file of public/`,
    ]);
  });

  test("a decision without its number, date or author, or superseded wrongly", () => {
    const problems = withPages(
      page(`${decisions}/no-number.md`, { title: "X", status: "current" }),
      page(`${decisions}/0099-replaced.md`, {
        title: "Y",
        status: "current",
        decided: "2026-01-01",
        decided_by: "Board",
        superseded_by: `${decisions}/0100-missing`,
      }),
    );
    expect(problems).toEqual([
      `${lang}/${decisions}/no-number.md: a decision is named <number>-<short-name>.md, e.g. 0002-...`,
      `${lang}/${decisions}/no-number.md: a decision says when (decided) and who (decided_by) decided`,
      `${lang}/${decisions}/0099-replaced.md: superseded_by names no decision page (${decisions}/0100-missing)`,
      `${lang}/${decisions}/0099-replaced.md: a superseded decision has status: outdated`,
    ]);
  });

  test("a glossary term that is already there under another name", () => {
    const problems = withPages(
      page(`${glossary}/a.md`, { title: "Order", aliases: ["job"] }),
      page(`${glossary}/b.md`, { title: "Job" }),
    );
    expect(problems).toEqual([
      `${lang}/${glossary}/b.md: the term "Job" is already in ${lang}/${glossary}/a.md`,
    ]);
  });
});

describe("reading pages", () => {
  test("frontmatter", () => {
    const { frontmatter, body } = splitFrontmatter("---\ntitle: A\naliases: [b, c]\n---\n\nText");
    expect(frontmatter).toEqual({ title: "A", aliases: ["b", "c"] });
    expect(body).toBe("\nText");
  });

  test("links of every form Markdown and Starlight render, and none in code", () => {
    const body = [
      'Inline [a](/a/), [t](/t/#k "title"), ![img](/img.png), [s](</with space/>), [p](/a_(b)/).',
      "Full [x][one], collapsed [Two][], shortcut [three].",
      "",
      "[one]: /one/",
      "[two]: </two/> 'Title'",
      "  [three]: /three/?q=1",
      "> [quoted]: /quoted/",
      "- [listed]: /listed/",
      "[^1]: A footnote, not a link.",
      "",
      "Elsewhere [e](https://e.example/) <https://auto.example/> [m](mailto:a@b.c) [h](#here) [cdn](//cdn.example/x)",
      '<a href="/html/">x</a> <img src="/html.png">',
      "`[code](/code/)` and ``[[double]](/double/)``",
      "<!-- [comment](/comment/) -->",
      "```md",
      "[fenced](/fenced/)",
      "[fd]: /fenced-definition/",
      "```",
      "~~~",
      "[tilde](/tilde/)",
      "~~~",
      "- item",
      "",
      "    continued with [a link](/continued/)",
    ].join("\n");
    expect(internalLinks(body)).toEqual([
      "/a/",
      "/t/",
      "/img.png",
      "/with space/",
      "/a_(b)/",
      "/continued/",
      "/one/",
      "/two/",
      "/three/",
      "/quoted/",
      "/listed/",
      "/html/",
      "/html.png",
    ]);
  });
});
