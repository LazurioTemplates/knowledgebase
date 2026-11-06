// The look of the knowledge base comes from the Organization's design system
// (LazurioTemplates/design-system and its adoptions), never invented here and
// never read at run time: `tokens.json` beside this file is a reviewed
// snapshot of the design system's `content/brand/colors/tokens.json`, and
// `design-system.lock.json` names its repository, commit and SHA-256.
//
// This file turns the snapshot into Starlight's CSS custom properties
// (src/styles/theme.css) and the favicon (data/v2/public/favicon.svg);
// `bun run theme:write` writes both and the tests fail when they are stale.
// It reads only what the theme needs: the colour roles of both themes and the
// two font stacks. The design system's own tests hold the rest of its shape.

export const THEMES = ["light", "dark"] as const;
export type ThemeName = (typeof THEMES)[number];

// The roles of the design system this theme uses. A role names a primitive
// colour of `colors` once per theme; the theme never names a primitive itself.
export const ROLES = [
  "surface",
  "surface-raised",
  "surface-sunken",
  "text",
  "text-muted",
  "text-subtle",
  "border",
  "border-strong",
  "accent",
  "accent-hover",
  "on-accent",
  "accent-text",
  "accent-subtle",
  "focus",
  "success",
  "success-subtle",
  "warning",
  "warning-subtle",
  "danger",
  "danger-subtle",
  "scrim",
] as const;
export type Role = (typeof ROLES)[number];

export type ThemeTokens = Readonly<{
  name: string;
  /** #rrggbb of every role, per theme. */
  themes: Readonly<Record<ThemeName, Readonly<Record<Role, string>>>>;
  fonts: Readonly<{ sans: string; mono: string }>;
}>;

const HEX = /^#[0-9a-f]{6}$/i;

function object(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function parseThemeTokens(value: unknown): ThemeTokens {
  const tokens = object(value, "tokens");
  if (typeof tokens.name !== "string" || tokens.name === "") {
    throw new Error("tokens.name must be a non-empty string");
  }
  const colors = object(tokens.colors, "tokens.colors");
  for (const [name, hex] of Object.entries(colors)) {
    if (typeof hex !== "string" || !HEX.test(hex)) {
      throw new Error(`tokens.colors.${name} must be a #rrggbb colour`);
    }
  }
  const themeMap = object(tokens.themes, "tokens.themes");
  const themes = {} as Record<ThemeName, Record<Role, string>>;
  for (const theme of THEMES) {
    const roles = object(themeMap[theme], `tokens.themes.${theme}`);
    const resolved = {} as Record<Role, string>;
    for (const role of ROLES) {
      const primitive = roles[role];
      if (typeof primitive !== "string" || typeof colors[primitive] !== "string") {
        throw new Error(`tokens.themes.${theme}.${role} must name a colour of tokens.colors`);
      }
      resolved[role] = (colors[primitive] as string).toLowerCase();
    }
    themes[theme] = resolved;
  }
  const families = object(object(tokens.typography, "tokens.typography").families, "families");
  for (const family of ["sans", "mono"] as const) {
    if (typeof families[family] !== "string" || families[family] === "") {
      throw new Error(`tokens.typography.families.${family} must be a font stack`);
    }
  }
  return {
    name: tokens.name,
    themes,
    fonts: { sans: families.sans as string, mono: families.mono as string },
  };
}

// Starlight's colour properties and the role each one takes. Starlight names
// its scale from the dark theme: `white` is the strongest text and `black` the
// page in both themes, and `gray-6` is a panel just off the page: lighter than
// the page in the dark theme, darker in the light one.
const PANEL: Readonly<Record<ThemeName, Role>> = {
  dark: "surface-raised",
  light: "surface-sunken",
};

const starlight = (theme: ThemeName): ReadonlyArray<readonly [string, Role]> => [
  ["--sl-color-white", "text"],
  ["--sl-color-gray-1", "text"],
  ["--sl-color-gray-2", "text-muted"],
  ["--sl-color-gray-3", "text-subtle"],
  ["--sl-color-gray-4", "border-strong"],
  ["--sl-color-gray-5", "border"],
  ["--sl-color-gray-6", PANEL[theme]],
  ["--sl-color-gray-7", "surface-raised"],
  ["--sl-color-black", "surface"],
  ["--sl-color-accent-low", "accent-subtle"],
  ["--sl-color-accent", "accent"],
  ["--sl-color-accent-high", "accent-text"],
  ["--sl-color-text", "text"],
  ["--sl-color-text-accent", "accent-text"],
  ["--sl-color-text-invert", "on-accent"],
  ["--sl-color-bg", "surface"],
  ["--sl-color-bg-nav", "surface-raised"],
  ["--sl-color-bg-sidebar", "surface"],
  ["--sl-color-bg-inline-code", PANEL[theme]],
  ["--sl-color-bg-accent", "accent"],
  ["--sl-color-hairline-light", "border"],
  ["--sl-color-hairline", "border"],
  ["--sl-color-hairline-shade", PANEL[theme]],
  // Asides and badges: note and tip in the accent, success, caution, danger.
  ["--sl-color-blue-low", "accent-subtle"],
  ["--sl-color-blue", "accent"],
  ["--sl-color-blue-high", "accent-text"],
  ["--sl-color-purple-low", "accent-subtle"],
  ["--sl-color-purple", "accent"],
  ["--sl-color-purple-high", "accent-text"],
  ["--sl-color-green-low", "success-subtle"],
  ["--sl-color-green", "success"],
  ["--sl-color-green-high", "success"],
  ["--sl-color-orange-low", "warning-subtle"],
  ["--sl-color-orange", "warning"],
  ["--sl-color-orange-high", "warning"],
  ["--sl-color-red-low", "danger-subtle"],
  ["--sl-color-red", "danger"],
  ["--sl-color-red-high", "danger"],
];

/** The pairs of roles the theme puts text on, and the contrast each needs
 * (WCAG 2.2 AA: 4.5:1 for text). */
export const TEXT_PAIRS: ReadonlyArray<readonly [Role, Role]> = [
  ...(["surface", "surface-raised", "surface-sunken"] as const).flatMap((background) =>
    (["text", "text-muted", "text-subtle", "accent-text"] as const).map(
      (foreground) => [foreground, background] as const,
    ),
  ),
  ["on-accent", "accent"],
  ["accent-text", "accent-subtle"],
  ["success", "success-subtle"],
  ["warning", "warning-subtle"],
  ["danger", "danger-subtle"],
];

function block(selector: string, lines: readonly string[]): string {
  return `${selector} {\n${lines.map((line) => `  ${line}`).join("\n")}\n}\n`;
}

function variables(tokens: ThemeTokens, theme: ThemeName): string[] {
  const roles = tokens.themes[theme];
  return [
    ...starlight(theme).map(([property, role]) => `${property}: ${roles[role]};`),
    `--sl-color-backdrop-overlay: color-mix(in srgb, ${roles.scrim} 66%, transparent);`,
    `--kb-focus: ${roles.focus};`,
  ];
}

/** src/styles/theme.css: Starlight is dark at `:root` and light under
 * `[data-theme="light"]`; the fonts are the design system's stacks. */
export function themeStylesheet(tokens: ThemeTokens, source: string): string {
  return [
    "/*",
    ` * Generated by \`bun run theme:write\` from the design system snapshot`,
    ` * (${source}). Do not edit: change the design system and refresh the snapshot.`,
    " */\n",
    block(":root", [
      `--sl-font: ${tokens.fonts.sans};`,
      `--sl-font-mono: ${tokens.fonts.mono};`,
      ...variables(tokens, "dark"),
    ]),
    block(':root[data-theme="light"]', variables(tokens, "light")),
  ].join("\n");
}

/** data/v2/public/favicon.svg: an open book in the light theme's accent. */
export function faviconSvg(tokens: ThemeTokens): string {
  const accent = tokens.themes.light.accent;
  const paper = tokens.themes.light["on-accent"];
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Knowledgebase">`,
    `  <rect width="64" height="64" rx="14" fill="${accent}"/>`,
    `  <path d="M14 18c6-2 12-1 18 3v27c-6-4-12-5-18-3V18Z" fill="${paper}"/>`,
    `  <path d="M50 18c-6-2-12-1-18 3v27c6-4 12-5 18-3V18Z" fill="${paper}" opacity="0.82"/>`,
    "</svg>",
    "",
  ].join("\n");
}

// WCAG 2.x relative luminance and contrast ratio of two #rrggbb colours.
function luminance(hex: string): number {
  const channel = (offset: number) => {
    const c = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
