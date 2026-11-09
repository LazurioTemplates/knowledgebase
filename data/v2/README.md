# Knowledgebase data v2

This directory is the Organization's own content of the knowledge base: the
source of truth, edited by people and agents through pull requests. The App
in `app/v2` only reads it.

- `knowledgebase.json` declares the structure: the `language` the knowledge
  base is written and shown in (`cs` or `en`), and for each language the
  module carries its root pages and its sections, each with its directory,
  `kind`, label and what it holds. The App refuses to build when a page lives
  outside the declared structure.
- `docs/<language>/` holds the pages of a language, Markdown with
  frontmatter. Every section has an `index.md` with what belongs there and
  the outline of a page. The template carries `docs/cs/` and `docs/en/` with
  the same structure and example; `bun run start:language <cs|en>` in
  `app/v2` keeps one.
- `public/` holds files published at stable root URLs (images and documents
  the pages link to). The favicon is the design system's brand, built by the
  App.

Pages with `sample: true` are the template's invented example; `bun run
start:empty` in `app/v2` removes them. The metadata contract is in
[`ARCHITECTURE.md`](../../ARCHITECTURE.md).
