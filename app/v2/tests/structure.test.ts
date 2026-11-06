import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LANGUAGES,
  languagesOf,
  loadDeclaration,
  loadStructure,
  parseDeclaration,
  SECTION_KINDS,
  sidebarOf,
} from "../src/structure";
import { dataDir } from "./support/copy";

// The declared structure of data/v2 (knowledgebase.json): the language the App
// shows, and for each language its root pages and sections. The App builds its
// navigation from it and refuses content outside it.
const raw = JSON.parse(readFileSync(join(dataDir, "knowledgebase.json"), "utf8"));

describe("declared structure", () => {
  test("names a language of Lazurio, Czech unless the Organization chose another", () => {
    const declaration = loadDeclaration(dataDir);
    expect(LANGUAGES).toContain(declaration.language);
    expect(languagesOf(dataDir)[0]).toBe(declaration.language);
  });

  for (const language of languagesOf(dataDir)) {
    test(`${language}: holds for its pages, with every kind of section once`, () => {
      const structure = loadStructure(dataDir, language);
      expect(structure.root_pages[0]).toBe("index");
      expect(structure.sections.map((section) => section.kind).sort()).toEqual(
        [...SECTION_KINDS].sort(),
      );
    });

    test(`${language}: the navigation lists the root pages, then every section with its overview first`, () => {
      const structure = loadStructure(dataDir, language);
      const sidebar = sidebarOf(structure, dataDir);
      expect(sidebar.slice(0, structure.root_pages.length)).toEqual(
        structure.root_pages.map((slug) => ({ slug })),
      );
      for (const [i, section] of structure.sections.entries()) {
        const group = sidebar[structure.root_pages.length + i];
        expect(group && "items" in group ? group.label : null).toBe(section.label);
        expect(group && "items" in group ? group.items[0] : null).toEqual({
          slug: section.directory,
        });
      }
    });
  }

  test("refuses another schema, an undeclared language, a duplicate, a missing or unknown kind, an unclean name", () => {
    const language = raw.language as "cs" | "en";
    const own = raw.languages[language];
    const withSections = (sections: unknown[]) => ({
      ...raw,
      languages: { ...raw.languages, [language]: { ...own, sections } },
    });
    const [first, ...rest] = own.sections;
    expect(() => parseDeclaration({ ...raw, schema_version: "x" })).toThrow("schema_version");
    expect(() => parseDeclaration({ ...raw, language: "de" })).toThrow("language must name");
    expect(() => parseDeclaration({ ...raw, languages: { ...raw.languages, de: own } })).toThrow(
      "languages.de is not one of",
    );
    expect(() => parseDeclaration(withSections([first, first, ...rest]))).toThrow("declared twice");
    expect(() => parseDeclaration(withSections(rest))).toThrow("exactly one section");
    expect(() => parseDeclaration(withSections([{ ...first, kind: "notes" }, ...rest]))).toThrow(
      "kind must be one of",
    );
    expect(() =>
      parseDeclaration(withSections([{ ...first, directory: "Our Company" }, ...rest])),
    ).toThrow("is not a name");
    const other = { directory: "customers", kind: "other", label: "Customers", holds: "x" };
    expect(
      parseDeclaration(withSections([...own.sections, other])).languages[language]?.sections.at(-1)
        ?.kind,
    ).toBe("other");
  });
});
