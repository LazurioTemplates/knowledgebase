import { resolve } from "node:path";

// tests/support/link-forms.md holds every form of a link a page may hold.
// These are its site-relative targets as the site renders them, in the
// order of the page: the unit test holds the parser to them, and the build
// test holds them to the page Starlight renders.
export const LINK_FORMS = resolve(import.meta.dir, "link-forms.md");

export const LINK_FORMS_INTERNAL = [
  "/a/",
  "/t/",
  "/image.png",
  "/with space/",
  "/a_(b)/",
  "/es_caped/",
  "/one/",
  "/two/",
  "/three/",
  "/picture.png",
  "/picture.png",
  "/next-line/",
  "/split/",
  "/quoted/",
  "/listed/",
  "/html/",
  "/unquoted/",
  "/html.png",
  "/small.png",
  "/large.png",
  "/fallback.png",
  "/cell/",
  "/footnote/",
  "/aside/",
];

/** Read by the content rules although the site renders the tag as text:
 * Astro's Markdown processor (Satteri) does not take an HTML tag whose
 * unquoted attribute value starts with "/" as HTML, while CommonMark and the
 * micromark parser of the content rules do. Reading a link more than renders
 * can only make the empty start refuse, never leave a link broken. */
export const LINK_FORMS_NOT_RENDERED = ["/unquoted/"];
