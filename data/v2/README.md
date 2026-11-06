# Knowledgebase data v2

This directory is the Organization's own content of the knowledge base: the
source of truth, edited by people and agents through pull requests. The App
in `app/v2` only reads it.

- `knowledgebase.json` declares the structure: the language, the root pages
  and the sections, each with its directory, its label and what it holds. The
  App refuses to build when a page lives outside the declared structure.
- `docs/` holds the pages, Markdown with frontmatter, in the Organization's
  language. Every section has an `index.md` with what belongs there and the
  outline of a page.
- `public/` holds files published at stable root URLs (images and documents
  the pages link to). `favicon.svg` is generated from the design system
  snapshot (`bun run theme:write`).

Pages with `sample: true` are the template's invented example; `bun run
start:empty` in `app/v2` removes them. The metadata contract is in
[`ARCHITECTURE.md`](../../ARCHITECTURE.md).
