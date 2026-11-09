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
- Pages: `data/v2/docs/<language>/`, Markdown (`.md`) with frontmatter,
  directly in a section directory or one of the root pages. This is the only
  page corpus. MDX is not read: its grammar differs, and a knowledge base
  page needs no components; Starlight's asides work in Markdown (`:::note`).
- Files the pages link to: `data/v2/public/`.
- Look: the Organization's design system, the package `design-system` on a
  released tag (`app/v2/package.json`; `bun.lock` pins the tag's commit and
  its `sha512`). The template depends on `LazurioTemplates/design-system`
  v2.0.0, the invented Example brand.

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
| `description` | One sentence; shown under the title. |
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
file names, only `.md` files beside the pages, links from the site root that
resolve, no link from an own page to an example, numbered decisions with their
date and author, a replaced decision marked outdated, and no glossary term or
alias defined twice. `bun run start:empty` reads links the same way.

The links of a page are read by parsers, never by patterns
(`app/v2/src/pages.ts`). Astro 7 renders Markdown with its Satteri processor:
CommonMark with GFM, and Starlight adds directives for asides. The content
rules parse a page with the same grammar using micromark
(`mdast-util-from-markdown` with its GFM and directive extensions, the parser
Starlight's `remark-directive` brings) and the raw HTML in it with `parse5`,
the WHATWG HTML parser a browser follows. They read every link that renders:
inline links and images, reference links and images through their definition
(also a destination on the next line), autolinks, footnotes, links in asides
and the URL attributes of raw HTML (`href`, `src`, `srcset`, `poster`); code,
comments, HTML blocks and references without a definition are no links. The
build test renders a page of every link form (`app/v2/tests/support/link-forms.md`)
and compares the links Starlight renders with the links the rules read. One
difference is known and locked in that test: Satteri renders an HTML tag
whose unquoted attribute value starts with `/` as text, which CommonMark reads
as HTML, so the rules read one link more than renders, never one less.

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
  shows the description under the title and the other details in words under
  it (`src/meta.ts`, every field of the table above except `title` and
  `sample`); the route middleware (`src/routeData.ts`)
  puts a banner on every example page and names the section in the previous
  and next links instead of a bare "Přehled".
- The look comes from the design system's package. `src/styles/design-system.css`
  imports `design-system/styles.css` (tokens, the brand's fonts, base styles,
  components) into a cascade layer `design-system` declared before
  Starlight's: Starlight imports custom CSS first, so its own layout and
  components keep their rules and the design system's base rules fill only
  what Starlight leaves. `src/styles/theme.css` maps Starlight's colours,
  fonts and type scale onto the design system's roles (`--ds-color-*`); both
  switch the theme by `data-theme` on `<html>`. The status of a page is the
  design system's `Badge`, and `/favicon.svg` is its brand's logo symbol
  (`src/favicon.ts`). The tests check that every token the styles name exists
  in the package, that the theme names roles and no colour of its own, and
  that every text colour Starlight draws on a surface reaches WCAG AA
  contrast in both themes.
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

## Agents

The module's skills (`.agents/skills/`, mirrored to `.claude/skills/`) are
the procedures agents follow: search before answering, write a procedure,
record a decision, add a term. They find sections by kind and end in a pull
request; merging stays the person's Publication.

## Invariants

- `data/v2/docs` is the only page corpus and `knowledgebase.json` its only
  structure.
- Derived artefacts (`.astro/`, `dist/`) are rebuilt and never committed.
- The design system is a dependency on a released tag, never a copy, a
  relative path or a branch.
- Secrets, platform accounts, raw exports and customers' data never enter the
  module.
- The App never reads another repository at run time.
