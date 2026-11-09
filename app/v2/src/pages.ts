import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { directiveFromMarkdown } from "mdast-util-directive";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { directive } from "micromark-extension-directive";
import { gfm } from "micromark-extension-gfm";
import { parseFragment } from "parse5";

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
  const withoutExtension = path.replace(/\.md$/, "");
  if (withoutExtension === "index") return "";
  return withoutExtension.replace(/\/index$/, "");
}

function files(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const isPage = (file: string) => file.endsWith(".md");

/** Files beside the pages that are no page: an `.mdx` file (the App reads
 * Markdown only) or an image that belongs in data/v2/public/. Paths below the
 * content root, with "/" on every system. */
export function otherFiles(docs: string): string[] {
  return files(docs)
    .filter((file) => !isPage(file))
    .map((file) => relative(docs, file).split(sep).join("/"))
    .sort();
}

export function readPages(docs: string): Page[] {
  return files(docs)
    .filter(isPage)
    .map((file) => {
      const path = relative(docs, file).split(sep).join("/");
      const { frontmatter, body } = splitFrontmatter(readFileSync(file, "utf8"));
      return { path, slug: slugOf(path), frontmatter, body };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

// The links of a page as the site renders them. Astro 7 renders Markdown with
// its Satteri processor, CommonMark with GFM, and Starlight adds directives
// (`:::note` asides). The page is parsed with the same grammar by the
// micromark parser (`mdast-util-from-markdown`, the one Starlight's
// `remark-directive` already brings), and raw HTML by `parse5`, the HTML
// parser of the WHATWG specification, as a browser reads it. So code, HTML
// blocks and undefined references are never links, and every form of a link
// is (tests/build.test.ts compares the result with the rendered page).

type MarkdownNode = {
  type: string;
  children?: MarkdownNode[];
  url?: string;
  identifier?: string;
  value?: string;
};

type HtmlNode = {
  nodeName: string;
  attrs?: { name: string; value: string }[];
  childNodes?: HtmlNode[];
  content?: HtmlNode;
};

function parseMarkdown(body: string): MarkdownNode {
  return fromMarkdown(body, {
    extensions: [gfm(), directive()],
    mdastExtensions: [gfmFromMarkdown(), directiveFromMarkdown()],
  }) as unknown as MarkdownNode;
}

// Starlight renders a text or leaf directive it does not claim as its own text
// (src/integrations/satteri.ts, "directives restoration"), so a link in its
// label is not a link.
const TEXT_ONLY = new Set(["textDirective", "leafDirective"]);

function* markdownNodes(node: MarkdownNode): Generator<MarkdownNode> {
  yield node;
  if (TEXT_ONLY.has(node.type)) return;
  for (const child of node.children ?? []) yield* markdownNodes(child);
}

// The URL attributes of raw HTML: links and areas (`href`), images, media and
// frames (`src`, `srcset`, `poster`), on any element, also inside a template.
const URL_ATTRIBUTES = new Set(["href", "src", "poster"]);

function htmlTargets(html: string): string[] {
  const targets: string[] = [];
  const visit = (node: HtmlNode) => {
    for (const { name, value } of node.attrs ?? []) {
      if (URL_ATTRIBUTES.has(name)) targets.push(value);
      if (name === "srcset") {
        for (const candidate of value.split(",")) {
          const url = candidate.trim().split(/\s+/)[0];
          if (url) targets.push(url);
        }
      }
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  };
  visit(parseFragment(html) as unknown as HtmlNode);
  return targets;
}

/** Every link target of a page that the site renders, in the order of the
 * page: inline links and images, reference links and images through their
 * definition (full, collapsed and shortcut; a reference without a definition
 * stays text, and a definition nothing refers to renders nothing), GFM
 * autolinks and footnotes, links inside asides, and the URL attributes of
 * raw HTML. */
export function linkTargets(body: string): string[] {
  const nodes = [...markdownNodes(parseMarkdown(body))];
  // The first definition of a label wins, as CommonMark says.
  const definitions = new Map<string, string>();
  for (const node of nodes) {
    if (node.type === "definition" && node.identifier && !definitions.has(node.identifier)) {
      definitions.set(node.identifier, node.url ?? "");
    }
  }
  const targets: string[] = [];
  for (const node of nodes) {
    if (node.type === "link" || node.type === "image") targets.push(node.url ?? "");
    else if (node.type === "linkReference" || node.type === "imageReference") {
      const url = node.identifier === undefined ? undefined : definitions.get(node.identifier);
      if (url !== undefined) targets.push(url);
    } else if (node.type === "html") targets.push(...htmlTargets(node.value ?? ""));
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
