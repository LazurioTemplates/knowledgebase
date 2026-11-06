import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { generate, paths, repositoryOf } from "../src/cli/design-system";
import { parseLock, sha256 } from "../src/design-system/lock";
import {
  contrastRatio,
  parseThemeTokens,
  TEXT_PAIRS,
  THEMES,
  themeStylesheet,
} from "../src/design-system/theme";

// The look comes from a locked snapshot of the design system's tokens: the
// snapshot is the file its lock names, the theme and the favicon are what the
// snapshot generates, and the text the theme puts on a surface is readable.
const tokensBytes = readFileSync(paths.tokens, "utf8");
const lock = parseLock(JSON.parse(readFileSync(paths.lock, "utf8")));
const tokens = parseThemeTokens(JSON.parse(tokensBytes));

describe("design system snapshot", () => {
  test("is the file its lock names, byte for byte", () => {
    expect(sha256(tokensBytes)).toBe(lock.sha256);
  });

  test("theme.css and favicon.svg are current (bun run theme:write)", () => {
    const generated = generate(tokensBytes, lock);
    expect(readFileSync(paths.theme, "utf8")).toBe(generated.theme);
    expect(readFileSync(paths.favicon, "utf8")).toBe(generated.favicon);
  });

  test("an edited snapshot is refused", () => {
    expect(() => generate(`${tokensBytes} `, lock)).toThrow("does not match the SHA-256");
  });

  test("tokens without a role the theme needs are refused", () => {
    const raw = JSON.parse(tokensBytes);
    const { focus: _focus, ...light } = raw.themes.light;
    expect(() => parseThemeTokens({ ...raw, themes: { ...raw.themes, light } })).toThrow(
      "tokens.themes.light.focus",
    );
  });

  test("names the repository of a GitHub remote", () => {
    expect(repositoryOf("https://github.com/Acme/design-system.git")).toBe("Acme/design-system");
    expect(repositoryOf("git@github.com:Acme/design-system.git")).toBe("Acme/design-system");
    expect(repositoryOf("/srv/git/design-system")).toBeNull();
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

test("the stylesheet sets Starlight's colours for both themes and the fonts", () => {
  const css = themeStylesheet(tokens, "test");
  expect(css).toContain(":root {");
  expect(css).toContain(':root[data-theme="light"] {');
  expect(css).toContain(`--sl-font: ${tokens.fonts.sans};`);
  expect(css).not.toMatch(/undefined/);
});
