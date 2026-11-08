# Changelog: knowledgebase

A release is an annotated tag `v<semver>` with a GitHub Release; the version
is independent of the App generation ([`docs/extending.md`](docs/extending.md)).

## 0.1.0

Draft of the first release of the template; it gets its date when it is
tagged. The App is generation `app/v2` on the stack profile `content@2026.11`
of Lazurio.

### For people

- A knowledge base in Czech or English with six sections: About the
  Organization, People and roles, Processes and procedures, Procedures for
  agents, Glossary and Decisions (O Organizaci, Lidé a role, Procesy a
  postupy, Postupy pro agenty, Slovník, Rozhodnutí). Every section has an
  overview with what belongs there and the outline of a page.
- One language on every screen: the interface and the pages follow the
  language of the knowledge base, Czech unless the Organization works in
  English.
- Two starts: the invented Organization Example with one page in every
  section, each marked by a banner, or an empty start that keeps only the
  structure (`bun run start:empty`).
- Under the title of a page its description, then its other details in
  words: whether it is valid, who keeps it true, when it was last confirmed,
  other names of a term, its sources, and for a decision who decided, when,
  and what replaced it.
- Search across all pages, including the other names of terms.
- The look of the Organization's design system, light and dark.

### For Organizations and agents

- **Content beside the App.** The pages are Markdown in
  `data/v2/docs/<language>/`; the structure is declared in
  `data/v2/knowledgebase.json` (the language shown and, per language, root
  pages and sections with their `kind`). The App refuses content outside it
  and builds the navigation from the files, so a new page needs no
  navigation change.
- **Czech and English.** The structure, the example and the App's own words
  in both languages; `bun run start:language <cs|en>` keeps the
  Organization's. Lazurio passes no language to a module yet
  (Lazurio/LazurioPlatform#909), so the adoption records it from the
  Folder's profile.
- **Skills for agents** in `.agents/skills/` with the `.claude/skills/`
  mirror: `knowledgebase-search` (search before answering and name the page),
  `knowledgebase-write-procedure`, `knowledgebase-record-decision`,
  `knowledgebase-add-term`.
- **Content rules** that name the page and what to do: placement and file
  names, links that resolve (inline, reference and HTML links alike), no
  link from own content to an example, numbered decisions with date and
  author, replaced decisions marked outdated, no term defined twice.
- **Design system as a locked copy**: the tokens of
  `LazurioTemplates/design-system` v1.0.0, copied unchanged, with a lock
  (source, release, commit, SHA-256 of the copied file and of the adapted
  source) in the shape the other Marketplace templates use;
  `bun run design-system:sync -- <checkout> <tag>` takes the Organization's
  own or a newer release, `bun run theme:write` regenerates the theme (the
  colours of both themes, the fonts, the type scale). Tests hold the lock,
  the generated files and WCAG AA contrast of the theme's text.
- **One gate:** `bun run check` runs the type check, Biome and every test
  (structure and content of each language, the starts, the design system
  copy and its contrast, skills, Windows paths, template contract, start and
  the build of each language). CI runs it on Linux, and on Windows for
  changes of the App.
- **Stack:** Bun 1.4.4, Astro 7.4.5, Starlight 0.42.8, `@astrojs/check`
  0.9.12, TypeScript 6.0.3, Biome 2.6.4, `@lazurio/module-kit` 0.2.0; every
  version exact.
- Documents: `docs/adoption.md`, `docs/extending.md`, `ARCHITECTURE.md`, and
  Marketplace screens in `docs/screenshots/cs/` and `docs/screenshots/en/`.

### Source

Born from the plan of `lazurio module create --stack astro-starlight` of
LazurioPlatform `main`, with a fresh history. The general structure and rules
come from the public LazurioExampleOrganization/knowledgebase (Astro 5.18,
Starlight 0.37), without its content. The Organization identity is
placeholders (`company` `REPLACE-WITH-ORG-NAME`, runtime id
`replace-with-org-slug-knowledgebase-v2`, port lease 24972, the scaffold's
default for this module in the pool of the templates).

### For adopted modules

Nothing yet: this is the first release.
