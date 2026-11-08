import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// The pages of data/v2/docs as the tests and the command-line tools read
// them: path, slug, frontmatter and the links in the text. Bun only (it parses
// the frontmatter with Bun.YAML); the App itself reads pages through Astro.

export type Page = Readonly<{
  /** Path below the content root, with "/" on every system. */
  path: string;
  /** The URL path without slashes: "procesy/novy-kolega"; "" for the home page. */
  slug: string;
  frontmatter: Readonly<Record<string, unknown>>;
  body: string;
}>;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function splitFrontmatter(source: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = FRONTMATTER.exec(source);
  if (!match) return { frontmatter: {}, body: source };
  const parsed: unknown = Bun.YAML.parse(match[1] ?? "");
  const frontmatter =
    typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  return { frontmatter, body: source.slice(match[0].length) };
}

export function slugOf(path: string): string {
  const withoutExtension = path.replace(/\.mdx?$/, "");
  if (withoutExtension === "index") return "";
  return withoutExtension.replace(/\/index$/, "");
}

function files(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.mdx?$/.test(name) ? [path] : [];
  });
}

export function readPages(docs: string): Page[] {
  return files(docs)
    .map((file) => {
      const path = relative(docs, file).split(sep).join("/");
      const { frontmatter, body } = splitFrontmatter(readFileSync(file, "utf8"));
      return { path, slug: slugOf(path), frontmatter, body };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

// Code is not a link: fenced code blocks, inline code and HTML comments are
// removed before links are read. Indented lines stay: four spaces are as often
// the continuation of a list item, and a link missed there would be worse than
// a link in code that gets checked.
function withoutCode(body: string): string {
  return body
    .replace(/^[ \t>]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t>]*\1[`~]*[ \t]*$/gm, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(`+)[^`]*?\1/g, "");
}

/** Every link target of a page as Markdown and Starlight render it: inline
 * links and images (`[text](/x/ "title")`, `![alt](</x y/>)`), the
 * definitions behind reference links (`[text][ref]`, `[ref][]` and `[ref]`
 * all point to `[ref]: /x/`), and the `href` and `src` of raw HTML. A
 * definition counts even when nothing refers to it. */
export function linkTargets(body: string): string[] {
  const text = withoutCode(body);
  const targets: string[] = [];
  const destination = String.raw`(?:<([^>\n]*)>|([^\s()<>]+(?:\([^\s()]*\)[^\s()<>]*)*))`;
  const inline = new RegExp(
    String.raw`\]\(\s*${destination}(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)`,
    "g",
  );
  for (const match of text.matchAll(inline)) targets.push(match[1] ?? match[2] ?? "");
  // A definition may stand in a quote or a list item; `[^1]:` is a footnote.
  const definition = new RegExp(
    String.raw`^[ \t>]*(?:(?:[-*+]|\d+[.)])[ \t]+)?\[(?!\^)[^\]\n]+\]:[ \t]*${destination}`,
    "gm",
  );
  for (const match of text.matchAll(definition)) targets.push(match[1] ?? match[2] ?? "");
  for (const match of text.matchAll(
    /<(?:a|img|source)\b[^>]*?\s(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
  )) {
    targets.push(match[1] ?? match[2] ?? "");
  }
  return targets.map((target) => target.trim()).filter((target) => target !== "");
}

/** Site-relative link targets of a page (see `linkTargets`), with the anchor
 * and the query cut off. Links to other sites (a scheme such as `https:` or
 * `mailto:`) and anchors on the same page are not returned; a relative link is,
 * so that the content rules can ask for a link from the site root. */
export function internalLinks(body: string): string[] {
  const links: string[] = [];
  for (const target of linkTargets(body)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#") || target.startsWith("//")) {
      continue;
    }
    links.push(target.replace(/[#?].*$/, ""));
  }
  return links;
}

/** The slug a site-relative link points to: "/procesy/x/" → "procesy/x". */
export function linkSlug(target: string): string {
  return target.replace(/^\/+|\/+$/g, "");
}

export const isSample = (page: Page): boolean => page.frontmatter.sample === true;
