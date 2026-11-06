import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { type DesignSystemLock, describeSource, readLock, sha256, tokensCopy } from "./lock";
import { faviconSvg, parseThemeTokens, themeStylesheet } from "./theme";

// What the App generates from its copy of the design system's tokens: the
// theme (src/styles/theme.css) and the favicon (data/v2/public/favicon.svg).
// `bun run theme:write` writes both; the tests fail when they are stale.

export const app = resolve(import.meta.dir, "../..");
export const generatedPaths = {
  theme: join(app, "src/styles/theme.css"),
  favicon: join(app, "../../data/v2/public/favicon.svg"),
};

/** Throws when the copy is not the file its lock names. */
export function generate(tokensBytes: string, lock: DesignSystemLock) {
  if (sha256(tokensBytes) !== tokensCopy(lock).sha256) {
    throw new Error(
      `${tokensCopy(lock).to} does not match the SHA-256 of its lock; sync the design system instead of editing the copy`,
    );
  }
  const tokens = parseThemeTokens(JSON.parse(tokensBytes));
  return { theme: themeStylesheet(tokens, describeSource(lock)), favicon: faviconSvg(tokens) };
}

export function writeGenerated(appDir: string = app): string {
  const lock = readLock(appDir);
  const { theme, favicon } = generate(
    readFileSync(join(appDir, tokensCopy(lock).to), "utf8"),
    lock,
  );
  writeFileSync(join(appDir, "src/styles/theme.css"), theme);
  writeFileSync(join(appDir, "../../data/v2/public/favicon.svg"), favicon);
  return describeSource(lock);
}

if (import.meta.main) {
  try {
    console.log(`Theme and favicon written from ${writeGenerated()}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
