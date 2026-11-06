import type { Language } from "./structure";

// The words the App itself adds to the pages, in each language of Lazurio.
// Starlight translates its own interface (search, navigation, theme) by the
// language of the page.

export type Labels = Readonly<{
  /** The language's name in the language itself. */
  name: string;
  /** The label every section gives its own overview page in the navigation. */
  overview: string;
  /** The banner on every page of the template's invented example. */
  sampleBanner: string;
  facts: Readonly<{
    status: string;
    decidedBy: string;
    decided: string;
    supersededBy: string;
    owner: string;
    reviewed: string;
    aliases: string;
  }>;
  statuses: Readonly<{ draft: string; current: string; outdated: string }>;
}>;

export const LABELS: Readonly<Record<Language, Labels>> = {
  cs: {
    name: "Čeština",
    overview: "Přehled",
    sampleBanner:
      "Ukázka s vymyšlenou Organizací Example. Nahraďte ji vlastním obsahem, nebo všechny ukázky smažte (<code>bun run start:empty</code>).",
    facts: {
      status: "Stav",
      decidedBy: "Kdo rozhodl",
      decided: "Kdy",
      supersededBy: "Nahrazeno",
      owner: "Odpovídá",
      reviewed: "Ověřeno",
      aliases: "Také",
    },
    statuses: {
      draft: "rozpracováno, zatím neplatí",
      current: "platí",
      outdated: "zastaralé, platí jen pro historii",
    },
  },
  en: {
    name: "English",
    overview: "Overview",
    sampleBanner:
      "An example with the invented Organization Example. Replace it with your own content, or remove every example (<code>bun run start:empty</code>).",
    facts: {
      status: "Status",
      decidedBy: "Decided by",
      decided: "Decided on",
      supersededBy: "Replaced by",
      owner: "Owner",
      reviewed: "Reviewed",
      aliases: "Also",
    },
    statuses: {
      draft: "draft, not valid yet",
      current: "valid",
      outdated: "outdated, kept for history",
    },
  },
};

/** The labels of a page's language; Czech for a language Lazurio does not have. */
export function labelsOf(language: string | undefined): Labels {
  return language === "en" ? LABELS.en : LABELS.cs;
}
