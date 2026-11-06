import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import packageJson from "../package.json";
import { readContent } from "../src/content-check";
import { SAMPLE_BANNER } from "../src/labels";

// The build contract of the Lazurio Module Standard (4.5): opened from `main`,
// the App runs as its build. The Launchpad runs `build_script` with only bun on
// PATH, `NODE_ENV=production` and no listener, then serves `build_output` with
// its own static server; the declared health path must resolve to a file of
// the output directly (a path ending in `/` to its `index.html`), because the
// probe does not follow redirects. The build holds every page of data/v2, in
// the language the structure declares, and its search index.
const app = resolve(import.meta.dir, "..");
const runtime = packageJson.lazurio.runtime;
const [entrypoint] = runtime.listeners;
if (!entrypoint) throw new Error("lazurio.runtime declares no listener");
const output = join(app, runtime.build_output);
const content = readContent(resolve(app, "../../data/v2"));
const buildTimeoutMs = 180_000;

const isFile = (path: string) => statSync(path, { throwIfNoEntry: false })?.isFile() ?? false;
const pageHtml = (slug: string) => join(output, slug, "index.html");

describe("build contract", () => {
  test(
    "builds without the listener environment and serves the health path as a file",
    () => {
      // As the Launchpad does, so that an earlier build never passes for this one.
      rmSync(output, { recursive: true, force: true });
      const run = Bun.spawnSync([process.execPath, "--no-env-file", "run", runtime.build_script], {
        cwd: app,
        env: {
          HOME: process.env.HOME ?? "",
          PATH: dirname(process.execPath),
          NODE_ENV: "production",
          ...(process.env.SYSTEMROOT ? { SYSTEMROOT: process.env.SYSTEMROOT } : {}),
        },
        stdout: "pipe",
        stderr: "pipe",
      });
      if (run.exitCode !== 0) console.error(run.stderr.toString());
      expect(run.exitCode).toBe(0);
      const path = entrypoint.health.path;
      const files = path.endsWith("/") ? [`${path}index.html`] : [path, `${path}.html`];
      expect(files.some((file) => isFile(join(output, file)))).toBe(true);
    },
    buildTimeoutMs,
  );

  test("every page is built, in the declared language, examples with their banner", () => {
    for (const page of content.pages) {
      const file = pageHtml(page.slug);
      expect(isFile(file), page.path).toBe(true);
      const html = readFileSync(file, "utf8");
      expect(html, page.path).toContain(`<html lang="${content.structure.language}"`);
      expect(html.includes(SAMPLE_BANNER), page.path).toBe(page.frontmatter.sample === true);
    }
  });

  test("has a search index and a not-found page", () => {
    expect(existsSync(join(output, "pagefind"))).toBe(true);
    expect(isFile(join(output, "404.html"))).toBe(true);
  });
});
