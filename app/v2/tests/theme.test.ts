import { afterEach, describe, expect, test } from "bun:test";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { app, generate, generatedPaths } from "../src/design-system/generate";
import { LOCK_PATH, parseLock, readLock, sha256, tokensCopy } from "../src/design-system/lock";
import { repositoryUrl, syncDesignSystem } from "../src/design-system/sync";
import {
  contrastRatio,
  parseThemeTokens,
  TEXT_PAIRS,
  THEMES,
  themeStylesheet,
} from "../src/design-system/theme";

// The look comes from a locked copy of the design system's tokens: the copy is
// the file its lock names, the theme and the favicon are what it generates,
// the text the theme puts on a surface is readable, and a sync takes another
// release from a checkout at its tag.
const lock = readLock(app);
const tokensBytes = readFileSync(join(app, tokensCopy(lock).to), "utf8");
const tokens = parseThemeTokens(JSON.parse(tokensBytes));
let scratch = "";

afterEach(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
  scratch = "";
});

function git(cwd: string, ...args: string[]) {
  const run = Bun.spawnSync(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Test",
      GIT_AUTHOR_EMAIL: "test@example.invalid",
      GIT_COMMITTER_NAME: "Test",
      GIT_COMMITTER_EMAIL: "test@example.invalid",
    },
  });
  if (run.exitCode !== 0) throw new Error(run.stderr.toString());
  return run.stdout.toString().trim();
}

describe("design system copy", () => {
  test("is the file its lock names, byte for byte", () => {
    expect(sha256(tokensBytes)).toBe(tokensCopy(lock).sha256);
  });

  test("theme.css and favicon.svg are current (bun run theme:write)", () => {
    const generated = generate(tokensBytes, lock);
    expect(readFileSync(generatedPaths.theme, "utf8")).toBe(generated.theme);
    expect(readFileSync(generatedPaths.favicon, "utf8")).toBe(generated.favicon);
  });

  test("an edited copy is refused", () => {
    expect(() => generate(`${tokensBytes} `, lock)).toThrow("does not match the SHA-256");
  });

  test("a lock without the tokens or with another shape is refused", () => {
    expect(() => parseLock({ ...lock, copied: [] })).toThrow("copied names");
    expect(() => parseLock({ ...lock, extra: 1 })).toThrow("has exactly");
  });

  test("tokens without a role the theme needs are refused", () => {
    const raw = JSON.parse(tokensBytes);
    const { focus: _focus, ...light } = raw.themes.light;
    expect(() => parseThemeTokens({ ...raw, themes: { ...raw.themes, light } })).toThrow(
      "tokens.themes.light.focus",
    );
  });

  test("names the repository of a GitHub remote", () => {
    expect(repositoryUrl("https://github.com/Acme/design-system.git")).toBe(
      "https://github.com/Acme/design-system",
    );
    expect(repositoryUrl("git@github.com:Acme/design-system.git")).toBe(
      "https://github.com/Acme/design-system",
    );
    expect(repositoryUrl("/srv/git/design-system")).toBeNull();
  });

  test("a sync takes the files of a tag, rewrites the lock and names a changed adaptation", () => {
    scratch = mkdtempSync(join(realpathSync.native(tmpdir()), "kb-design-system-"));
    const source = join(scratch, "design-system");
    const target = join(scratch, "app");
    mkdirSync(join(source, "content/brand/colors"), { recursive: true });
    mkdirSync(join(source, "app/v1/src"), { recursive: true });
    const darker = tokensBytes.replace('"graphite-950": "#0e1117"', '"graphite-950": "#0d1016"');
    writeFileSync(join(source, "content/brand/colors/tokens.json"), darker);
    writeFileSync(join(source, "app/v1/src/tokens.ts"), "// changed\n");
    git(source, "init", "-q");
    git(source, "add", "-A");
    git(source, "commit", "-q", "-m", "release");
    git(source, "tag", "v9.0.0");
    mkdirSync(join(target, "src/design-system"), { recursive: true });
    cpSync(join(app, LOCK_PATH), join(target, LOCK_PATH));

    const report = syncDesignSystem({
      app: target,
      checkout: source,
      ref: "v9.0.0",
      source: "https://github.com/Acme/design-system",
    });
    expect(report.lock.ref).toBe("v9.0.0");
    expect(report.lock.commit).toBe(git(source, "rev-parse", "HEAD"));
    expect(readFileSync(join(target, "src/design-system/tokens.json"), "utf8")).toBe(darker);
    expect(readLock(target)).toEqual(report.lock);
    expect(report.changed).toEqual([
      { from: "app/v1/src/tokens.ts", to: "src/design-system/theme.ts" },
    ]);
    expect(() =>
      syncDesignSystem({
        app: target,
        checkout: source,
        ref: "v0.0.1",
        source: report.lock.source,
      }),
    ).toThrow("no tag or commit");
  });
});

describe("contrast (WCAG AA, 4.5:1 for text) in both themes", () => {
  for (const theme of THEMES) {
    for (const [text, surface] of TEXT_PAIRS) {
      test(`${theme}: ${text} on ${surface}`, () => {
        const roles = tokens.themes[theme];
        expect(contrastRatio(roles[text], roles[surface])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

test("the stylesheet sets Starlight's colours for both themes, the fonts and the type scale", () => {
  const css = themeStylesheet(tokens, "test");
  expect(css).toContain(":root {");
  expect(css).toContain(':root[data-theme="light"] {');
  expect(css).toContain(`--sl-font: ${tokens.fonts.sans};`);
  expect(css).toContain(`--sl-text-h1: ${tokens.sizes.h1 / 16}rem;`);
  expect(css).not.toMatch(/undefined/);
});
