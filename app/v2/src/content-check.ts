import { existsSync } from "node:fs";
import { join } from "node:path";
import { internalLinks, isSample, linkSlug, type Page, readPages } from "./pages";
import { loadStructure, NAME, type Structure, sectionOf } from "./structure";

// The rules of the content in data/v2 beyond what Astro's schema checks: where
// a page lives, how it is named, that its links resolve, and the rules of the
// glossary and the decisions. Each problem is one line that says which page and
// what to do; the tests expect none. Bun only (see pages.ts).

const STATUSES = new Set(["draft", "current", "outdated"]);
const DECISION_FILE = /^\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

export type Content = Readonly<{ structure: Structure; pages: readonly Page[]; publicDir: string }>;

export function readContent(dataRoot: string): Content {
  const structure = loadStructure(dataRoot);
  return {
    structure,
    pages: readPages(join(dataRoot, structure.content_root)),
    publicDir: join(dataRoot, "public"),
  };
}

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

export function contentProblems({ structure, pages, publicDir }: Content): string[] {
  const problems: string[] = [];
  const bySlug = new Map(pages.map((page) => [page.slug, page]));
  const sections = new Set(structure.sections.map((section) => section.directory));
  const roots = new Set(structure.root_pages.map((page) => `${page}.md`));
  const decisions = sectionOf(structure, "decisions").directory;
  const glossary = sectionOf(structure, "glossary").directory;
  const terms = new Map<string, string>();

  for (const page of pages) {
    const { path, frontmatter: meta } = page;
    const parts = path.split("/");
    const file = parts.at(-1) ?? path;

    if (!isText(meta.title)) problems.push(`${path}: the frontmatter has no title`);
    if (!NAME.test(file.replace(/\.mdx?$/, ""))) {
      problems.push(`${path}: name the file in lowercase ASCII words joined by hyphens`);
    }
    const placed =
      (parts.length === 1 && roots.has(file)) ||
      (parts.length === 2 && sections.has(parts[0] ?? ""));
    if (!placed) {
      problems.push(`${path}: a page lives directly in a section of knowledgebase.json`);
    }
    if (meta.status !== undefined && !STATUSES.has(String(meta.status))) {
      problems.push(`${path}: status is draft, current or outdated`);
    }
    if (meta.sample !== undefined && typeof meta.sample !== "boolean") {
      problems.push(`${path}: sample is true or false`);
    }
    if (isSample(page) && (file === "index.md" || parts.length === 1)) {
      problems.push(`${path}: the home page, the guide and the overviews are never examples`);
    }

    for (const target of internalLinks(page.body)) {
      if (!target.startsWith("/")) {
        problems.push(`${path}: link "${target}" from the site root, for example /slovnik/pojem/`);
        continue;
      }
      const slug = linkSlug(target);
      const linked = bySlug.get(slug);
      if (!linked && !existsSync(join(publicDir, slug))) {
        problems.push(`${path}: the link ${target} leads to no page and no file of public/`);
      } else if (linked && isSample(linked) && !isSample(page)) {
        problems.push(
          `${path}: links to the example ${target}; the empty start would break the link`,
        );
      }
    }

    if (parts[0] === decisions && file !== "index.md") {
      if (!DECISION_FILE.test(file)) {
        problems.push(`${path}: a decision is named <number>-<short-name>.md, e.g. 0002-...`);
      }
      if (!STATUSES.has(String(meta.status))) {
        problems.push(`${path}: a decision has a status (draft, current or outdated)`);
      }
      if (meta.status !== "draft" && (meta.decided === undefined || !isText(meta.decided_by))) {
        problems.push(`${path}: a decision says when (decided) and who (decided_by) decided`);
      }
      if (meta.superseded_by !== undefined) {
        const by = String(meta.superseded_by);
        if (!by.startsWith(`${decisions}/`) || !bySlug.has(by)) {
          problems.push(`${path}: superseded_by names no decision page (${by})`);
        }
        if (meta.status !== "outdated") {
          problems.push(`${path}: a superseded decision has status: outdated`);
        }
      }
    }

    if (parts[0] === glossary && file !== "index.md") {
      const aliases = Array.isArray(meta.aliases) ? meta.aliases : [];
      for (const name of [meta.title, ...aliases]) {
        if (!isText(name)) continue;
        const key = name.trim().toLocaleLowerCase("cs");
        const other = terms.get(key);
        if (other) problems.push(`${path}: the term "${name}" is already in ${other}`);
        else terms.set(key, path);
      }
    }
  }
  return problems;
}
