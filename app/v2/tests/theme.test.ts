import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { color, contrast, logoSymbol, MINIMUM } from "design-system";
import { faviconSvg } from "../src/favicon";
import { appDir } from "./support/copy";

// The look comes from the design system's package: theme.css maps Starlight's
// properties onto its tokens, the layout names only its tokens, every token
// named exists in the package, and the text the theme puts on a surface is
// readable in both themes.
const styles = (name: string) => readFileSync(join(appDir, "src/styles", name), "utf8");
const theme = styles("theme.css");
const tokensCss = readFileSync(
  Bun.fileURLToPath(import.meta.resolve("design-system/tokens.css")),
  "utf8",
);
const defined = new Set([...tokensCss.matchAll(/(--ds-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

/** Starlight property → design system colour role, from theme.css. */
const roles = new Map(
  [...theme.matchAll(/(--sl-color-[a-z0-9-]+):\s*var\(--ds-color-([a-z-]+)\)/g)].map((m) => [
    m[1] as string,
    m[2] as string,
  ]),
);
type Theme = keyof typeof color;
const hex = (themeName: Theme, property: string) => {
  const role = roles.get(property);
  if (!role) throw new Error(`theme.css maps no ${property}`);
  return (color[themeName] as Record<string, string>)[role] as string;
};

describe("design system package", () => {
  test("every token the styles name is a token of the package", () => {
    for (const name of ["design-system.css", "theme.css", "knowledgebase.css"]) {
      const used = [...styles(name).matchAll(/var\((--ds-[a-z0-9-]+)\)/g)].map((m) => m[1]);
      expect(
        used.filter((token) => !defined.has(token)),
        name,
      ).toEqual([]);
    }
  });

  test("theme.css maps Starlight's colours to roles of both themes, and only to roles", () => {
    expect(roles.size).toBeGreaterThan(30);
    for (const [property, role] of roles) {
      expect(role in color.light && role in color.dark, `${property}: ${role}`).toBe(true);
    }
    expect(theme).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
  });

  test("the layout names no colour of its own", () => {
    expect(styles("knowledgebase.css")).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
  });

  test("the favicon is the brand's logo symbol in its ink and accent", () => {
    const svg = faviconSvg();
    expect(svg).toContain(logoSymbol.markup);
    expect(svg).toContain(`color:${color.light.ink}`);
    expect(svg).toContain(`--ds-color-accent:${color.dark.accent}`);
  });
});

// WCAG 2.2 AA, 4.5:1 for text: the pairs Starlight draws text with.
const TEXT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["--sl-color-white", "--sl-color-black"],
  ["--sl-color-gray-2", "--sl-color-black"],
  ["--sl-color-gray-3", "--sl-color-gray-6"],
  ["--sl-color-gray-2", "--sl-color-bg-nav"],
  ["--sl-color-text-accent", "--sl-color-black"],
  ["--sl-color-text-invert", "--sl-color-text-accent"],
  ["--sl-color-accent-high", "--sl-color-accent-low"],
  ["--sl-color-banner-text", "--sl-color-banner-bg"],
  ["--sl-color-blue-high", "--sl-color-blue-low"],
  ["--sl-color-purple-high", "--sl-color-purple-low"],
  ["--sl-color-green-high", "--sl-color-green-low"],
  ["--sl-color-orange-high", "--sl-color-orange-low"],
  ["--sl-color-red-high", "--sl-color-red-low"],
];

describe("contrast (WCAG AA) in both themes", () => {
  for (const themeName of ["light", "dark"] as const) {
    for (const [text, surface] of TEXT_PAIRS) {
      test(`${themeName}: ${text} on ${surface}`, () => {
        expect(contrast(hex(themeName, text), hex(themeName, surface))).toBeGreaterThanOrEqual(
          MINIMUM.text,
        );
      });
    }
  }
});
