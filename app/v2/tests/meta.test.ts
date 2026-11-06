import { expect, test } from "bun:test";
import { czechDate, describePage } from "../src/meta";

// The metadata under a page's title, in words.
test("dates in the Czech form, the same in every time zone", () => {
  expect(czechDate(new Date("2026-10-06T00:00:00Z"))).toBe("6. 10. 2026");
});

test("a page's metadata in words, a decision with its replacement as a link", () => {
  const facts = describePage(
    {
      status: "outdated",
      decided: new Date("2026-09-15"),
      decided_by: "Vedení",
      superseded_by: "rozhodnuti/0002-novy-postup",
      owner: "Vedení",
      reviewed: new Date("2026-10-30"),
      aliases: ["test", "pokus"],
    },
    (id) => `/${id}/`,
  );
  expect(facts).toEqual([
    { label: "Stav", value: "zastaralé, platí jen pro historii", tone: "outdated" },
    { label: "Kdo rozhodl", value: "Vedení" },
    { label: "Kdy", value: "15. 9. 2026" },
    { label: "Nahrazeno", value: "0002-novy-postup", href: "/rozhodnuti/0002-novy-postup/" },
    { label: "Odpovídá", value: "Vedení" },
    { label: "Ověřeno", value: "30. 10. 2026" },
    { label: "Také", value: "test, pokus" },
  ]);
  expect(describePage({}, (id) => id)).toEqual([]);
});
