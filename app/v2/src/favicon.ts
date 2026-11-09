import { color, logoSymbol } from "design-system";

// The favicon is the brand's logo symbol from the design system's package, in
// the brand's ink and accent of the light theme, and of the dark theme where
// the device prefers it. A new release of the design system (or the
// Organization's own) changes it with the brand. Served at /favicon.svg by
// src/pages/favicon.svg.ts.
export function faviconSvg(): string {
  const { light, dark } = color;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${logoSymbol.viewBox}">`,
    `<style>svg{color:${light.ink};--ds-color-accent:${light.accent}}@media (prefers-color-scheme: dark){svg{color:${dark.ink};--ds-color-accent:${dark.accent}}}</style>`,
    logoSymbol.markup,
    "</svg>",
    "",
  ].join("\n");
}
