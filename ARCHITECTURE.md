# Knowledgebase architecture

## Role

The knowledge base is the Organization's own record of how it works: what it
does, who is responsible for what, how repeated work is done by people and by
agents, what its words mean and what it decided and why. It is the source an
agent searches before it answers how the Organization works.

It is not a store for secrets or customers' data, a planning tool, a CMS with
an editor in the browser, or a copy of raw sources. Plans live in the
Organization's planning (Mission Control), raw sources in their own modules;
the knowledge base keeps the confirmed result and links the source.

## Source of truth

- Structure: `data/v2/knowledgebase.json` (`lazurio.knowledgebase.v2`): the
  `language` the knowledge base is written and shown in (`cs` or `en`, the
  languages of Lazurio, Czech by default), and under `languages` the
  structure of each language the module carries: its root pages (`index` and
  the guide) and its sections, each with its directory, `kind`, label and
  what it holds. Six kinds have exactly one section each in a language
  (`organization`, `roles`, `processes`, `agent-procedures`, `glossary`,
  `decisions`); further sections are of kind `other`.
- Pages: `data/v2/docs/<language>/`, Markdown with frontmatter, directly in a
  section directory or one of the root pages. This is the only page corpus.
- Files the pages link to: `data/v2/public/`.
- Look: `app/v2/src/design-system/tokens.json`, an unchanged copy of the
  design system's tokens, with `lock.json` (the design system's repository,
  release and commit, the copied file with its SHA-256, and the file the
  theme adapted with the SHA-256 of its source).

## Language

The knowledge base is written and shown in one language. The language of
Lazurio for an Organization is the `locale` of the Folder's profile
(`<Folder>/.lazurio/preferences.json`, `profile.locale`, `cs` or `en`).
Lazurio passes no language to a module's App today, neither in its
environment nor through `/.lazurio/shell.json` on the module's origin
(Lazurio/LazurioPlatform#909), so the adoption records it in
`knowledgebase.json` (`bun run start:language <cs|en>`) and Czech is the
default. The App builds that one language: Starlight's interface in it, the
App's own words from `app/v2/src/labels.ts`, and only the pages of
`data/v2/docs/<language>/`; a screen never mixes two languages. The template
carries both languages with the same structure and example; an adopted
module keeps one.

Root documents (`README.md`, `AGENTS.md`, this file, `CHANGELOG.md`) describe
the module; they are never a second content corpus.

## Metadata of a page

| Field | Meaning |
|---|---|
| `title` | Required. What people search for. |
| `description` | One sentence; shown in search results. |
| `status` | `draft` (written, not confirmed), `current`, `outdated` (kept for history). |
| `owner` | The role or person who keeps the page true. |
| `reviewed` | When someone last confirmed the page against reality. |
| `aliases` | Other names of the subject; shown under the title, so search finds them. |
| `sources` | Where the knowledge comes from. |
| `decided`, `decided_by` | A decision: when and by whom. |
| `superseded_by` | A replaced decision: the page of the decision that replaced it. |
| `sample` | The template's invented example; `bun run start:empty` removes it. |

The App's content schema (`app/v2/src/content.config.ts`) types these fields
and stops the build on a wrong value. The content rules
(`app/v2/src/content-check.ts`, run by the tests) hold the rest: placement and
file names, links from the site root that resolve, no link from an own page
to an example, numbered decisions with their date and author, a replaced
decision marked outdated, and no glossary term or alias defined twice.

## Runtime

`app/v2` is a read-only viewer on Astro and Starlight:

- Starlight reads the pages through Astro's `glob` loader pointed at
  `data/v2/docs/<language>`, so the content needs no copy or symlink.
- The App reads `knowledgebase.json` when Astro loads its configuration
  (`src/structure.ts`): it refuses an undeclared directory or a section
  without its overview, and builds the navigation from the files of each
  section (overview first, then by file name). Starlight's `autogenerate`
  reads only `src/content/docs`, so the App lists the files itself; a new
  page still needs no change of navigation.
- A component override of the page title (`src/components/PageTitle.astro`)
  shows the metadata in words; the route middleware (`src/routeData.ts`)
  puts a banner on every example page and names the section in the previous
  and next links instead of a bare "Přehled".
- `src/styles/theme.css` and `data/v2/public/favicon.svg` are generated from
  the copy of the design system's tokens (`bun run theme:write`): Starlight's
  colours of both themes, the font stacks and the type scale. The tests fail
  when they are stale, when the copy does not match its lock, or when a text
  colour of the theme falls below WCAG AA contrast on its surface.
- Search is Starlight's Pagefind index, built with the site.

The App follows the Lazurio Module Standard. Its single lease `main` lives in
`lazurio.module.json`. It reads its listener only from
`LAZURIO_RUNTIME_LISTENER_APP_*` through `@lazurio/module-kit` and refuses to
start without it; the configuration reads it only when Astro serves, never
during `astro build`. The preparation is `astro sync`. Opened from `main`, the
App runs as its static build (`build_output: "dist"`); `dev` runs one Astro
server for a preview from a worktree. The knowledge base has one locale at
the root, so the health path `/` is `dist/index.html` and answers 200 without
a redirect.

## Tools

Bun scripts in `app/v2/src/cli/`, run from `app/v2`:

- `bun run start:empty [--dry-run]`: removes every example page in every
  language and keeps the structure; refuses while an own page links to an
  example.
- `bun run start:language <cs|en> [--dry-run]`: makes one language the
  knowledge base's and removes the others.
- `bun run design-system:sync -- <checkout> <tag or commit>`: copies the
  files of the lock from the design system's commit (read from Git, not the
  working tree), rewrites the lock, regenerates the theme and names the
  adapted files whose source changed. Nothing is fetched.
- `bun run theme:write`: regenerates the theme and the favicon from the copy.

## Agents

The module's skills (`.agents/skills/`, mirrored to `.claude/skills/`) are
the procedures agents follow: search before answering, write a procedure,
record a decision, add a term. They find sections by kind and end in a pull
request; merging stays the person's Publication.

## Invariants

- `data/v2/docs` is the only page corpus and `knowledgebase.json` its only
  structure.
- Derived artefacts (`.astro/`, `dist/`) are rebuilt and never committed;
  generated files that are committed (`theme.css`, `favicon.svg`) are checked
  for staleness.
- Secrets, platform accounts, raw exports and customers' data never enter the
  module.
- The App never reads another repository at run time.
