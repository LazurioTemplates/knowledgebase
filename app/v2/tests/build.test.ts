import { describe, expect, test } from "bun:test";
import { copyFileSync, existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { parse } from "parse5";
import packageJson from "../package.json";
import { readContent } from "../src/content-check";
import { labelsOf } from "../src/labels";
import { internalLinks, splitFrontmatter } from "../src/pages";
import { type Language, languagesOf, loadDeclaration, sectionOf } from "../src/structure";
import { appDir, copyModule, dataDir, remove } from "./support/copy";
import { LINK_FORMS, LINK_FORMS_NOT_RENDERED } from "./support/link-forms";

// The build contract of the Lazurio Module Standard (4.5): opened from `main`,
// the App runs as its build. The Launchpad runs `build_script` with only bun on
// PATH, `NODE_ENV=production` and no listener, then serves `build_output` with
// its own static server; the declared health path must resolve to a file of
// the output directly (a path ending in `/` to its `index.html`), because the
// probe does not follow redirects. The build holds every page of the language
// the App shows, and only that language; each other language data/v2 carries
// builds the same way once it is the one shown.
const runtime = packageJson.lazurio.runtime;
const [entrypoint] = runtime.listeners;
if (!entrypoint) throw new Error("lazurio.runtime declares no listener");
const buildTimeoutMs = 180_000;

// Astro escapes text the way its escapeHTML does: & < > " and '.
const escapeHtml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type HtmlNode = {
  nodeName: string;
  attrs?: { name: string; value: string }[];
  childNodes?: HtmlNode[];
};

/** The site-relative link targets inside a rendered page's Markdown content
 * (Starlight's `.sl-markdown-content`), as `internalLinks` gives them: decoded,
 * without anchor and query, without other sites and same-page anchors. */
function renderedLinks(html: string): string[] {
  const targets: string[] = [];
  const collect = (node: HtmlNode) => {
    for (const { name, value } of node.attrs ?? []) {
      if (name === "href" || name === "src" || name === "poster") targets.push(value);
      if (name === "srcset") {
        for (const candidate of value.split(","))
          targets.push(candidate.trim().split(/\s+/)[0] ?? "");
      }
    }
    for (const child of node.childNodes ?? []) collect(child);
  };
  const find = (node: HtmlNode) => {
    const classes = node.attrs?.find((attr) => attr.name === "class")?.value.split(/\s+/) ?? [];
    if (classes.includes("sl-markdown-content")) collect(node);
    else for (const child of node.childNodes ?? []) find(child);
  };
  find(parse(html) as unknown as HtmlNode);
  return (
    targets
      .filter((target) => target !== "" && !/^[a-z][a-z0-9+.-]*:/i.test(target))
      .filter((target) => !target.startsWith("#") && !target.startsWith("//"))
      // Astro's own build assets (the styles and script of a code block).
      .filter((target) => !target.startsWith("/_astro/"))
      .map((target) => decodeURI(target.replace(/[#?].*$/, "")))
  );
}

const isFile = (path: string) => statSync(path, { throwIfNoEntry: false })?.isFile() ?? false;

function build(app: string) {
  const output = join(app, runtime.build_output);
  // As the Launchpad does, so that an earlier build never passes for this one.
  rmSync(output, { recursive: true, force: true });
  const run = Bun.spawnSync([process.execPath, "--no-env-file", "run", runtime.build_script], {
    cwd: app,
    env: {
      HOME: process.env.HOME ?? "",
      PATH: dirname(process.execPath),
      TMPDIR: process.env.TMPDIR ?? tmpdir(),
      NODE_ENV: "production",
      ...(process.env.SYSTEMROOT ? { SYSTEMROOT: process.env.SYSTEMROOT } : {}),
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  if (run.exitCode !== 0) console.error(run.stderr.toString());
  return { exitCode: run.exitCode, output };
}

function expectLanguage(output: string, data: string, language: Language) {
  const content = readContent(data, language);
  const banner = labelsOf(language).sampleBanner;
  for (const page of content.pages) {
    const file = join(output, page.slug, "index.html");
    expect(isFile(file), page.path).toBe(true);
    const html = readFileSync(file, "utf8");
    expect(html, page.path).toContain(`<html lang="${language}"`);
    expect(html.includes(banner), page.path).toBe(page.frontmatter.sample === true);
    // The details the guide promises under the title: the description and
    // the sources among them.
    const { description, sources } = page.frontmatter;
    if (typeof description === "string") {
      expect(html, page.path).toContain(`<p class="kb-description">${escapeHtml(description)}</p>`);
    }
    for (const source of Array.isArray(sources) ? sources : []) {
      expect(html, page.path).toContain(escapeHtml(String(source)));
    }
  }
  expect(existsSync(join(output, "pagefind"))).toBe(true);
  expect(isFile(join(output, "404.html"))).toBe(true);
}

describe("build contract", () => {
  const shown = loadDeclaration(dataDir).language;

  test(
    "builds without the listener environment and serves the health path as a file",
    () => {
      const { exitCode, output } = build(appDir);
      expect(exitCode).toBe(0);
      const path = entrypoint.health.path;
      const files = path.endsWith("/") ? [`${path}index.html`] : [path, `${path}.html`];
      expect(files.some((file) => isFile(join(output, file)))).toBe(true);
    },
    buildTimeoutMs,
  );

  test(`every page of the language shown (${shown}) is built in it, examples with their banner`, () => {
    expectLanguage(join(appDir, runtime.build_output), dataDir, shown);
  });

  for (const language of languagesOf(dataDir).filter((other) => other !== shown)) {
    test(
      `${language}: builds once it is the language shown, every page in it, every link as the content rules read it`,
      () => {
        const copy = copyModule(language);
        // The page of every link form, in the copy only: the links Starlight
        // renders are the links the content rules and the empty start read.
        const structure = loadDeclaration(copy.data).languages[language];
        if (!structure) throw new Error(`no structure for ${language}`);
        const section = sectionOf(structure, "processes").directory;
        copyFileSync(LINK_FORMS, join(copy.data, structure.content_root, section, "link-forms.md"));
        // Removed within the test: on Windows deleting the copy's installed
        // dependencies takes longer than a hook's five seconds.
        try {
          const { exitCode, output } = build(copy.app);
          expect(exitCode).toBe(0);
          expectLanguage(output, copy.data, language);
          const rendered = readFileSync(join(output, section, "link-forms", "index.html"), "utf8");
          const { body } = splitFrontmatter(readFileSync(LINK_FORMS, "utf8"));
          const read = internalLinks(body);
          for (const extra of LINK_FORMS_NOT_RENDERED) read.splice(read.indexOf(extra), 1);
          const sorted = (links: string[]) => [...links].sort();
          expect(sorted(renderedLinks(rendered))).toEqual(sorted(read));
        } finally {
          remove(copy.root);
        }
      },
      buildTimeoutMs,
    );
  }
});
