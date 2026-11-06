// The metadata of a page in the words people read under its title. Pure, so
// that the tests hold the wording and the dates.

export type PageMeta = Readonly<{
  status?: "draft" | "current" | "outdated" | undefined;
  owner?: string | undefined;
  reviewed?: Date | undefined;
  sample?: boolean | undefined;
  aliases?: readonly string[] | undefined;
  decided?: Date | undefined;
  decided_by?: string | undefined;
  superseded_by?: string | undefined;
}>;

export type Fact = Readonly<{
  label: string;
  value: string;
  href?: string | undefined;
  tone?: "draft" | "outdated" | undefined;
}>;

const STATUS = {
  draft: { value: "rozpracováno, zatím neplatí", tone: "draft" },
  current: { value: "platí", tone: undefined },
  outdated: { value: "zastaralé, platí jen pro historii", tone: "outdated" },
} as const;

/** 12. 10. 2026: the Czech way, and the same in every time zone. */
export function czechDate(date: Date): string {
  return `${date.getUTCDate()}. ${date.getUTCMonth() + 1}. ${date.getUTCFullYear()}`;
}

/** `superseded_by` names a page by its path in data/v2/docs without the
 * extension (`rozhodnuti/0002-...`); `href` turns it into a link. */
export function describePage(meta: PageMeta, href: (id: string) => string): Fact[] {
  const facts: Fact[] = [];
  if (meta.status) {
    const status = STATUS[meta.status];
    facts.push({ label: "Stav", value: status.value, tone: status.tone });
  }
  if (meta.decided_by) facts.push({ label: "Kdo rozhodl", value: meta.decided_by });
  if (meta.decided) facts.push({ label: "Kdy", value: czechDate(meta.decided) });
  if (meta.superseded_by) {
    facts.push({
      label: "Nahrazeno",
      value: meta.superseded_by.split("/").at(-1) ?? meta.superseded_by,
      href: href(meta.superseded_by),
    });
  }
  if (meta.owner) facts.push({ label: "Odpovídá", value: meta.owner });
  if (meta.reviewed) facts.push({ label: "Ověřeno", value: czechDate(meta.reviewed) });
  if (meta.aliases && meta.aliases.length > 0) {
    facts.push({ label: "Také", value: meta.aliases.join(", ") });
  }
  return facts;
}
