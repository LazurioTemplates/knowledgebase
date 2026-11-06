import { labelsOf } from "./labels";

// The metadata of a page in the words people read under its title, in the
// page's language. Pure, so that the tests hold the wording and the dates.

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
    const tone = meta.status === "current" ? undefined : meta.status;
    facts.push({ label: label.status, value: statuses[meta.status], tone });
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
  return facts;
}
