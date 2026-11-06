import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadStructure, parseStructure, SECTION_KINDS, sidebarOf } from "../src/structure";

// The declared structure of data/v2 (knowledgebase.json): the App builds its
// navigation from it and refuses content outside it.
const dataRoot = resolve(import.meta.dir, "../../../data/v2");
const raw = JSON.parse(readFileSync(join(dataRoot, "knowledgebase.json"), "utf8"));

describe("declared structure", () => {
  test("holds for the content of data/v2", () => {
    const structure = loadStructure(dataRoot);
    expect(structure.root_pages[0]).toBe("index");
    expect(structure.sections.map((section) => section.kind).sort()).toEqual(
      [...SECTION_KINDS].sort(),
    );
  });

  test("the navigation lists the root pages, then every section with its overview first", () => {
    const structure = loadStructure(dataRoot);
    const sidebar = sidebarOf(structure, dataRoot);
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

  test("refuses another schema, a duplicate, a missing or unknown kind, an unclean name", () => {
    expect(() => parseStructure({ ...raw, schema_version: "x" })).toThrow("schema_version");
    const [first, ...rest] = raw.sections;
    expect(() => parseStructure({ ...raw, sections: [first, first, ...rest] })).toThrow(
      "declared twice",
    );
    expect(() => parseStructure({ ...raw, sections: rest })).toThrow("exactly one section");
    expect(() =>
      parseStructure({ ...raw, sections: [{ ...first, kind: "notes" }, ...rest] }),
    ).toThrow("kind must be one of");
    expect(() =>
      parseStructure({ ...raw, sections: [{ ...first, directory: "O Organizaci" }, ...rest] }),
    ).toThrow("is not a name");
    expect(
      parseStructure({
        ...raw,
        sections: [
          ...raw.sections,
          { directory: "zakaznici", kind: "other", label: "Zákazníci", holds: "x" },
        ],
      }).sections.at(-1)?.kind,
    ).toBe("other");
  });
});
