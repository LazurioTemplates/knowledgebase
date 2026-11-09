import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// The declared structure of the content in data/v2 (Lazurio Module Standard,
// App generations: `app/v2` keeps its content beside the App, in `data/v2/`,
// with a declared structure the App checks). `knowledgebase.json` names the
// language the knowledge base is written and shown in, and for each language
// it carries the root pages and the sections; the pages of a language live in
// `docs/<language>/`. The App builds the one language the declaration names,
// so a screen never mixes two languages. The App reads the structure when
// Astro loads its configuration, so a structure that does not hold stops the
// build and the development server.
//
// This module runs under Node or Bun (Astro loads the configuration with the
// runtime that started it), so it uses only `node:` APIs.

export const SCHEMA_VERSION = "lazurio.knowledgebase.v2";

/** The languages of Lazurio (the `locale` of a Folder's profile). */
export const LANGUAGES = ["cs", "en"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "cs";

/** What a section is for. Agents and the checks find a section by its kind,
 * so an Organization may rename its directory and label. Each of these kinds
 * has exactly one section in a language; further sections of the
 * Organization's own (its customers, its products) are of kind `other`. */
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

/** The structure of one language. */
export type Structure = Readonly<{
  language: Language;
  /** The pages' directory below data/v2: `docs/<language>`. */
  content_root: string;
  root_pages: readonly string[];
  sections: readonly Section[];
}>;

export type Declaration = Readonly<{
  schema_version: typeof SCHEMA_VERSION;
  /** The language the App shows. */
  language: Language;
  languages: Readonly<Partial<Record<Language, Structure>>>;
}>;

/** data/v2, the content beside this App generation. */
export const defaultDataRoot = fileURLToPath(new URL("../../../data/v2/", import.meta.url));

// A file or directory name: lowercase ASCII words joined by hyphens, so that
// every path is a clean URL and checks out on every system.
export const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isLanguage = (value: unknown): value is Language =>
  (LANGUAGES as readonly unknown[]).includes(value);

function text(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`knowledgebase.json: ${path} must be a non-empty string`);
  }
  return value;
}

function parseLanguage(language: Language, value: unknown): Structure {
  const at = `languages.${language}`;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`knowledgebase.json: ${at} must be an object`);
  }
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.root_pages) || raw.root_pages[0] !== "index") {
    throw new Error(`knowledgebase.json: ${at}.root_pages must list the root pages, index first`);
  }
  const rootPages = raw.root_pages.map((page, i) => {
    const name = text(page, `${at}.root_pages[${i}]`);
    if (!NAME.test(name))
      throw new Error(`knowledgebase.json: ${at}.root_pages[${i}] is not a name`);
    return name;
  });
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    throw new Error(`knowledgebase.json: ${at}.sections must list at least one section`);
  }
  const seen = new Set<string>(rootPages);
  const sections = raw.sections.map((entry, i): Section => {
    const path = `${at}.sections[${i}]`;
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`knowledgebase.json: ${path} must be an object`);
    }
    const section = entry as Record<string, unknown>;
    const directory = text(section.directory, `${path}.directory`);
    if (!NAME.test(directory)) {
      throw new Error(`knowledgebase.json: ${path}.directory "${directory}" is not a name`);
    }
    if (seen.has(directory)) {
      throw new Error(`knowledgebase.json: "${directory}" is declared twice in ${at}`);
    }
    seen.add(directory);
    const kind = section.kind;
    if (kind !== "other" && !(SECTION_KINDS as readonly unknown[]).includes(kind)) {
      throw new Error(
        `knowledgebase.json: ${path}.kind must be one of ${SECTION_KINDS.join(", ")} or other`,
      );
    }
    return {
      directory,
      kind: kind as SectionKind,
      label: text(section.label, `${path}.label`),
      holds: text(section.holds, `${path}.holds`),
    };
  });
  for (const kind of SECTION_KINDS) {
    if (sections.filter((section) => section.kind === kind).length !== 1) {
      throw new Error(`knowledgebase.json: ${at} needs exactly one section of kind "${kind}"`);
    }
  }
  return { language, content_root: `docs/${language}`, root_pages: rootPages, sections };
}

export function parseDeclaration(value: unknown): Declaration {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("knowledgebase.json must be an object");
  }
  const raw = value as Record<string, unknown>;
  if (raw.schema_version !== SCHEMA_VERSION) {
    throw new Error(`knowledgebase.json: schema_version must be ${SCHEMA_VERSION}`);
  }
  const map = raw.languages;
  if (typeof map !== "object" || map === null || Array.isArray(map)) {
    throw new Error("knowledgebase.json: languages must map a language to its structure");
  }
  const languages: Partial<Record<Language, Structure>> = {};
  for (const [language, structure] of Object.entries(map)) {
    if (!isLanguage(language)) {
      throw new Error(
        `knowledgebase.json: languages.${language} is not one of ${LANGUAGES.join(", ")}`,
      );
    }
    languages[language] = parseLanguage(language, structure);
  }
  if (!isLanguage(raw.language) || !languages[raw.language]) {
    throw new Error("knowledgebase.json: language must name one of the declared languages");
  }
  return { schema_version: SCHEMA_VERSION, language: raw.language, languages };
}

export function loadDeclaration(dataRoot: string = defaultDataRoot): Declaration {
  return parseDeclaration(JSON.parse(readFileSync(join(dataRoot, "knowledgebase.json"), "utf8")));
}

/** The section of a kind: every kind has exactly one. */
export function sectionOf(structure: Structure, kind: (typeof SECTION_KINDS)[number]): Section {
  const section = structure.sections.find((candidate) => candidate.kind === kind);
  if (!section) throw new Error(`knowledgebase.json: no section of kind "${kind}"`);
  return section;
}

const pageFile = (name: string) => [`${name}.md`];

/** Checks one language's pages against its structure: every section has its
 * directory with an `index.md`, every root page exists, and nothing
 * undeclared lies beside them. */
export function checkStructure(dataRoot: string, structure: Structure): Structure {
  const docs = join(dataRoot, structure.content_root);
  if (!existsSync(docs)) {
    throw new Error(
      `data/v2/${structure.content_root} is missing for language "${structure.language}"`,
    );
  }
  for (const page of structure.root_pages) {
    if (!pageFile(page).some((file) => existsSync(join(docs, file)))) {
      throw new Error(
        `data/v2/${structure.content_root}: the root page "${page}" has no ${page}.md`,
      );
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
      throw new Error(
        `data/v2/${structure.content_root}: the section "${section.directory}" has no index.md`,
      );
    }
  }
  return structure;
}

/** The structure of a language (by default the one the App shows), checked
 * against the files; `docs/` holds no language the declaration lacks. */
export function loadStructure(dataRoot: string = defaultDataRoot, language?: Language): Structure {
  const declaration = loadDeclaration(dataRoot);
  for (const entry of readdirSync(join(dataRoot, "docs"))) {
    if (!isLanguage(entry) || !declaration.languages[entry]) {
      throw new Error(`data/v2/docs/${entry} is not a language declared in knowledgebase.json`);
    }
  }
  const structure = declaration.languages[language ?? declaration.language];
  if (!structure) throw new Error(`knowledgebase.json declares no language "${language}"`);
  return checkStructure(dataRoot, structure);
}

/** The declared languages, the one the App shows first. */
export function languagesOf(dataRoot: string = defaultDataRoot): Language[] {
  const declaration = loadDeclaration(dataRoot);
  return [
    declaration.language,
    ...LANGUAGES.filter((l) => l !== declaration.language && declaration.languages[l]),
  ];
}

export type SidebarEntry = { slug: string } | { label: string; items: { slug: string }[] };

/** The pages of a section as slugs: its overview first, then the other pages
 * by file name (decisions by their number). */
export function sectionSlugs(dataRoot: string, structure: Structure, section: Section): string[] {
  const directory = join(dataRoot, structure.content_root, section.directory);
  const pages = readdirSync(directory)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => file.replace(/\.md$/, ""))
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
