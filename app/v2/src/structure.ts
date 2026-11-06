import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// The declared structure of the content in data/v2 (Lazurio Module Standard,
// App generations: `app/v2` keeps its content beside the App, in `data/v2/`,
// with a declared structure the App checks). `knowledgebase.json` names the
// sections; every page lives in one of them or is one of the root pages. The
// App reads the structure when Astro loads its configuration, so a structure
// that does not hold stops the build and the development server.
//
// This module runs under Node or Bun (Astro loads the configuration with the
// runtime that started it), so it uses only `node:` APIs.

export const SCHEMA_VERSION = "lazurio.knowledgebase.v2";

/** What a section is for. Agents and the checks find a section by its kind,
 * so an Organization may rename its directory and label. Each of these kinds
 * has exactly one section; further sections of the Organization's own (its
 * customers, its products) are of kind `other`. */
export const SECTION_KINDS = [
  "organization",
  "roles",
  "processes",
  "agent-procedures",
  "glossary",
  "decisions",
] as const;
export type SectionKind = (typeof SECTION_KINDS)[number] | "other";

export type Section = Readonly<{
  directory: string;
  kind: SectionKind;
  label: string;
  holds: string;
}>;

export type Structure = Readonly<{
  schema_version: typeof SCHEMA_VERSION;
  content_root: string;
  language: string;
  root_pages: readonly string[];
  sections: readonly Section[];
}>;

/** data/v2, the content beside this App generation. */
export const defaultDataRoot = fileURLToPath(new URL("../../../data/v2/", import.meta.url));

// A file or directory name: lowercase ASCII words joined by hyphens, so that
// every path is a clean URL and checks out on every system.
export const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function text(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`knowledgebase.json: ${path} must be a non-empty string`);
  }
  return value;
}

export function parseStructure(value: unknown): Structure {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("knowledgebase.json must be an object");
  }
  const raw = value as Record<string, unknown>;
  if (raw.schema_version !== SCHEMA_VERSION) {
    throw new Error(`knowledgebase.json: schema_version must be ${SCHEMA_VERSION}`);
  }
  const contentRoot = text(raw.content_root, "content_root");
  const language = text(raw.language, "language");
  if (!Array.isArray(raw.root_pages) || !raw.root_pages.includes("index")) {
    throw new Error("knowledgebase.json: root_pages must list the pages at the root, index first");
  }
  const rootPages = raw.root_pages.map((page, i) => {
    const name = text(page, `root_pages[${i}]`);
    if (!NAME.test(name)) throw new Error(`knowledgebase.json: root_pages[${i}] is not a name`);
    return name;
  });
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    throw new Error("knowledgebase.json: sections must list at least one section");
  }
  const seen = new Set<string>(rootPages);
  const sections = raw.sections.map((entry, i): Section => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`knowledgebase.json: sections[${i}] must be an object`);
    }
    const section = entry as Record<string, unknown>;
    const directory = text(section.directory, `sections[${i}].directory`);
    if (!NAME.test(directory)) {
      throw new Error(`knowledgebase.json: sections[${i}].directory "${directory}" is not a name`);
    }
    if (seen.has(directory)) {
      throw new Error(`knowledgebase.json: "${directory}" is declared twice`);
    }
    seen.add(directory);
    const kind = section.kind;
    if (kind !== "other" && !(SECTION_KINDS as readonly unknown[]).includes(kind)) {
      throw new Error(
        `knowledgebase.json: sections[${i}].kind must be one of ${SECTION_KINDS.join(", ")} or other`,
      );
    }
    return {
      directory,
      kind: kind as SectionKind,
      label: text(section.label, `sections[${i}].label`),
      holds: text(section.holds, `sections[${i}].holds`),
    };
  });
  for (const kind of SECTION_KINDS) {
    if (sections.filter((section) => section.kind === kind).length !== 1) {
      throw new Error(`knowledgebase.json: exactly one section must be of kind "${kind}"`);
    }
  }
  return {
    schema_version: SCHEMA_VERSION,
    content_root: contentRoot,
    language,
    root_pages: rootPages,
    sections,
  };
}

/** The section of a kind: every kind has exactly one. */
export function sectionOf(structure: Structure, kind: (typeof SECTION_KINDS)[number]): Section {
  const section = structure.sections.find((candidate) => candidate.kind === kind);
  if (!section) throw new Error(`knowledgebase.json: no section of kind "${kind}"`);
  return section;
}

const pageFile = (name: string) => [`${name}.md`, `${name}.mdx`];

/** Reads and checks the structure: every section has its directory with an
 * `index.md`, every root page exists, and the content root holds nothing
 * undeclared. */
export function loadStructure(dataRoot: string = defaultDataRoot): Structure {
  const structure = parseStructure(
    JSON.parse(readFileSync(join(dataRoot, "knowledgebase.json"), "utf8")),
  );
  const docs = join(dataRoot, structure.content_root);
  for (const page of structure.root_pages) {
    if (!pageFile(page).some((file) => existsSync(join(docs, file)))) {
      throw new Error(`data/v2: the root page "${page}" has no file ${page}.md`);
    }
  }
  const declared = new Set([
    ...structure.sections.map((section) => section.directory),
    ...structure.root_pages.flatMap(pageFile),
  ]);
  for (const entry of readdirSync(docs)) {
    if (!declared.has(entry)) {
      throw new Error(
        `data/v2/${structure.content_root}/${entry} is not declared in knowledgebase.json`,
      );
    }
  }
  for (const section of structure.sections) {
    if (!existsSync(join(docs, section.directory, "index.md"))) {
      throw new Error(`data/v2: the section "${section.directory}" has no index.md`);
    }
  }
  return structure;
}

export type SidebarEntry = { slug: string } | { label: string; items: { slug: string }[] };

/** The pages of a section as slugs: its overview first, then the other pages
 * by file name (decisions by their number). */
export function sectionSlugs(dataRoot: string, structure: Structure, section: Section): string[] {
  const directory = join(dataRoot, structure.content_root, section.directory);
  const pages = readdirSync(directory)
    .filter((file) => /\.mdx?$/.test(file) && !file.startsWith("_"))
    .map((file) => file.replace(/\.mdx?$/, ""))
    .filter((name) => name !== "index")
    .sort((a, b) => a.localeCompare(b, "en"));
  return [section.directory, ...pages.map((name) => `${section.directory}/${name}`)];
}

/** The navigation: the root pages, then one group per section with its pages,
 * each labelled by its `sidebar.label` or title. It is read from the files, so
 * that a new page needs no change of navigation. (Starlight's own
 * `autogenerate` reads only `src/content/docs`, not a collection beside the
 * App.) */
export function sidebarOf(
  structure: Structure,
  dataRoot: string = defaultDataRoot,
): SidebarEntry[] {
  return [
    ...structure.root_pages.map((slug) => ({ slug })),
    ...structure.sections.map((section) => ({
      label: section.label,
      items: sectionSlugs(dataRoot, structure, section).map((slug) => ({ slug })),
    })),
  ];
}
