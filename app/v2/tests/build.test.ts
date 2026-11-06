import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import packageJson from "../package.json";
import { readContent } from "../src/content-check";
import { labelsOf } from "../src/labels";
import { type Language, languagesOf, loadDeclaration } from "../src/structure";
import { appDir, copyModule, dataDir, remove } from "./support/copy";

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
const copies: string[] = [];
afterAll(() => {
  for (const copy of copies) remove(copy);
});

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
      `${language}: builds once it is the language shown, every page in it`,
      () => {
        const copy = copyModule(language);
        copies.push(copy.root);
        const { exitCode, output } = build(copy.app);
        expect(exitCode).toBe(0);
        expectLanguage(output, copy.data, language);
      },
      buildTimeoutMs,
    );
  }
});
