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

/** Site-relative link targets in Markdown links: `[text](/procesy/x/)`, with the
 * anchor and the query cut off. Links to other sites and anchors on the same
 * page are not returned. */
export function internalLinks(body: string): string[] {
  const withoutCode = body.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  const links: string[] = [];
  for (const match of withoutCode.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    const target = match[1] ?? "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) continue;
    links.push(target.replace(/[#?].*$/, ""));
  }
  return links;
}

/** The slug a site-relative link points to: "/procesy/x/" → "procesy/x". */
export function linkSlug(target: string): string {
  return target.replace(/^\/+|\/+$/g, "");
}

export const isSample = (page: Page): boolean => page.frontmatter.sample === true;
