import { labelsOf } from "./labels";

// The metadata of a page in the words people read under its title, in the
// page's language: every detail of the guide's table except the title (the
// heading), the description (the line under it, src/components/PageTitle.astro)
// and `sample` (the banner). Pure, so that the tests hold the wording and the
// dates.

export type PageMeta = Readonly<{
  status?: "draft" | "current" | "outdated" | undefined;
  owner?: string | undefined;
  reviewed?: Date | undefined;
  sample?: boolean | undefined;
  aliases?: readonly string[] | undefined;
  sources?: readonly string[] | undefined;
  decided?: Date | undefined;
  decided_by?: string | undefined;
  superseded_by?: string | undefined;
}>;

/** One part of a fact's value; a source that is a web address is a link. */
export type Part = Readonly<{ text: string; href?: string | undefined }>;

export type Fact = Readonly<{
  label: string;
  value: string;
  /** The value in parts, when some of them are links (the sources). */
  parts?: readonly Part[] | undefined;
  href?: string | undefined;
  /** The status as a badge of the design system: its tone. */
  tone?: "success" | "warning" | "danger" | undefined;
  /** Search indexes this fact (the other names of a term). */
  indexed?: boolean | undefined;
}>;

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TONE = { current: "success", draft: "warning", outdated: "danger" } as const;

/** A date as people write it in the language, the same in every time zone:
 * 12. 10. 2026 in Czech, 12 October 2026 in English. */
export function formatDate(date: Date, language: string): string {
  const day = date.getUTCDate();
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  return language === "en" ? `${day} ${MONTHS_EN[month]} ${year}` : `${day}. ${month + 1}. ${year}`;
}

/** `superseded_by` names a page by its path in the language's pages without
 * the extension (`rozhodnuti/0002-...`); `href` turns it into a link. */
export function describePage(
  meta: PageMeta,
  language: string,
  href: (id: string) => string,
): Fact[] {
  const { facts: label, statuses } = labelsOf(language);
  const facts: Fact[] = [];
  if (meta.status) {
    facts.push({ label: label.status, value: statuses[meta.status], tone: TONE[meta.status] });
  }
  if (meta.decided_by) facts.push({ label: label.decidedBy, value: meta.decided_by });
  if (meta.decided) facts.push({ label: label.decided, value: formatDate(meta.decided, language) });
  if (meta.superseded_by) {
    facts.push({
      label: label.supersededBy,
      value: meta.superseded_by.split("/").at(-1) ?? meta.superseded_by,
      href: href(meta.superseded_by),
    });
  }
  if (meta.owner) facts.push({ label: label.owner, value: meta.owner });
  if (meta.reviewed) {
    facts.push({ label: label.reviewed, value: formatDate(meta.reviewed, language) });
  }
  if (meta.aliases && meta.aliases.length > 0) {
    facts.push({ label: label.aliases, value: meta.aliases.join(", "), indexed: true });
  }
  if (meta.sources && meta.sources.length > 0) {
    facts.push({
      label: label.sources,
      value: meta.sources.join("; "),
      parts: meta.sources.map((source) =>
        /^https?:\/\/\S+$/.test(source) ? { text: source, href: source } : { text: source },
      ),
    });
  }
  return facts;
}
