import { expect, test } from "bun:test";
import { describePage, formatDate } from "../src/meta";

// The metadata under a page's title, in words of the page's language.
test("dates as each language writes them, the same in every time zone", () => {
  const date = new Date("2026-10-06T00:00:00Z");
  expect(formatDate(date, "cs")).toBe("6. 10. 2026");
  expect(formatDate(date, "en")).toBe("6 October 2026");
});

const meta = {
  status: "outdated",
  decided: new Date("2026-09-15"),
  decided_by: "Vedení",
  superseded_by: "rozhodnuti/0002-novy-postup",
  owner: "Vedení",
  reviewed: new Date("2026-10-30"),
  aliases: ["test", "pokus"],
  sources: ["Plán EX-0001", "https://example.org/zapis"],
} as const;

test("a page's metadata in Czech, a decision with its replacement as a link", () => {
  expect(describePage(meta, "cs", (id) => `/${id}/`)).toEqual([
    { label: "Stav", value: "zastaralé, platí jen pro historii", tone: "danger" },
    { label: "Kdo rozhodl", value: "Vedení" },
    { label: "Kdy", value: "15. 9. 2026" },
    { label: "Nahrazeno", value: "0002-novy-postup", href: "/rozhodnuti/0002-novy-postup/" },
    { label: "Odpovídá", value: "Vedení" },
    { label: "Ověřeno", value: "30. 10. 2026" },
    { label: "Také", value: "test, pokus", indexed: true },
    {
      label: "Zdroje",
      value: "Plán EX-0001; https://example.org/zapis",
      parts: [
        { text: "Plán EX-0001" },
        { text: "https://example.org/zapis", href: "https://example.org/zapis" },
      ],
    },
  ]);
  expect(describePage({}, "cs", (id) => id)).toEqual([]);
});

test("the same metadata in English", () => {
  expect(
    describePage(meta, "en", (id) => `/${id}/`).map((fact) => `${fact.label}: ${fact.value}`),
  ).toEqual([
    "Status: outdated, kept for history",
    "Decided by: Vedení",
    "Decided on: 15 September 2026",
    "Replaced by: 0002-novy-postup",
    "Owner: Vedení",
    "Reviewed: 30 October 2026",
    "Also: test, pokus",
    "Sources: Plán EX-0001; https://example.org/zapis",
  ]);
});
