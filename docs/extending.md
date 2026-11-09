# Extending the knowledge base

How to keep developing this module after you adopted it, when it would change
generation and how, how to take a newer release of the template, and how the
template itself is released. For the first adoption see
[adoption.md](adoption.md).

## Generation and stack profile

The App is generation **`app/v2`**. In Lazurio a generation names the data
layer, not quality: `app/v1` and `app/v2` have no data layer of their own,
`app/v3` keeps records in repository-db, `app/v4` in a Dolt database. The
knowledge base is pages that people and agents write in pull requests and
that the App renders; their frontmatter describes a page, it is not a record
store. The pages lie beside the App in `data/v2/` with a structure the App
checks (`knowledgebase.json`), which is what `app/v2` means.

The tools follow the stack profile
**[`content@2026.11`](https://github.com/Lazurio/LazurioPlatform/blob/main/docs/stack-profiles.md#content)**
of Lazurio, shared by the Marketplace templates built on Astro (design
system, website, knowledge base). The profile defines the pins up to
`@lazurio/module-kit`; the knowledge base adds the Markdown and HTML parsers
its content rules read links with:

| Tool | Version | Why |
| --- | --- | --- |
| Bun (`packageManager`, runtime, tests, tools) | 1.4.4 | The App's runtime in Lazurio; `bun test` needs no other test runner |
| Astro | 7.4.5 | Static build, content collections |
| Starlight | 0.42.8 | Documentation layout, navigation, search (Pagefind) |
| `@astrojs/check` | 0.9.12 | Type check of `.astro` files |
| TypeScript | 6.0.3 | `astro check` does not support TypeScript 7 yet |
| Biome | 2.6.4 | Lint and format in one tool |
| `@lazurio/module-kit` | 0.2.0 | Listener, shutdown and development server options |
| `mdast-util-from-markdown` | 2.1.0 | The content rules and the empty start parse a page's links as Markdown (micromark), the version Starlight's `remark-directive` already installs |
| `micromark-extension-gfm`, `mdast-util-gfm` | 3.0.0, 3.1.0 | GFM, which Astro renders by default (tables, autolinks, footnotes) |
| `micromark-extension-directive`, `mdast-util-directive` | 4.0.0, 3.2.0 | The directive syntax of Starlight's asides, the versions Starlight installs |
| `parse5` | 8.0.1 | Raw HTML in a page, parsed as a browser does |
| `design-system` | `github:LazurioTemplates/design-system#v2.0.0` | The Organization's design system as a package on a released tag: styles, tokens, fonts, the status badge, the brand's logo |

Every dependency is pinned exactly (no `^` or `~`) and `bun.lock` is
committed; the template test fails on a range. What the upgrade guides of
Astro 7 and the profile's verification (Lazurio/LazurioPlatform#822) mean here:

- **Markdown processor.** Astro 7 no longer installs
  `@astrojs/markdown-remark`. The App adds no remark or rehype plugin of its
  own; Starlight renders the pages with its own processor, so the App does not
  need the package. A plugin added later needs it at the exact pin the
  profile names, in the `unified()` form.
- **TypeScript 6** loads no `@types/*` by itself; `tsconfig.json` names
  `"types": ["bun"]` for the tests and tools.
- **Biome** lints and formats the TypeScript, JSON and CSS of the App, leaves
  `.astro` files out, and keeps its Markdown and YAML formatters off: the
  Markdown formatter rewrites Starlight's frontmatter, and the pages are
  written by people and agents, not by a formatter.
- **Whitespace.** Astro 7 compresses HTML with `compressHTML: "jsx"`, which
  drops a space before an element across a line break in `.astro` files. The
  one `.astro` file of the App writes such spaces as `{" "}`. Markdown pages
  are not affected.

## Language

The knowledge base is written and shown in one language, Czech or English,
named by `language` in `data/v2/knowledgebase.json` (Czech by default). The
App builds the interface and the pages of that language only
(`data/v2/docs/<language>/`); its own words are in `app/v2/src/labels.ts`.
The template carries both languages with the same structure and example; an
adoption keeps the Organization's (`bun run start:language <cs|en>`).

Lazurio passes no language to a module's App today
(Lazurio/LazurioPlatform#909). Once it does, a release of the template can
let the App follow it instead of the recorded `language`; that changes no
content and no generation. An Organization that changes its language later
runs `start:language` on a module that still carries the other language, or
takes the other language's tree from the template's release and translates
its own pages; the knowledge base never shows two languages at once.

## Changes within the generation

Most work is here and needs nothing beyond an ordinary pull request:

- **Content.** Pages in `data/v2/docs/`, written with the module's skills
  (`.agents/skills/`). The content rules in `app/v2/src/content-check.ts` and
  the frontmatter schema in `app/v2/src/content.config.ts` hold them.
- **A section of the Organization's own** (customers, products, tools): add
  it to the language's `sections` in `data/v2/knowledgebase.json` with
  `"kind": "other"`, a directory name in lowercase ASCII, a label and what it
  holds, and create its `index.md` with what belongs there and the outline of
  a page. The navigation follows by itself.
- **A metadata field.** Add it to the schema in `content.config.ts`, describe
  it in `ARCHITECTURE.md` and the guide page of each language, and show it in
  `src/meta.ts` with its label in each language of `src/labels.ts` when
  people should see it.
- **The look.** It comes from the design system's package. A newer release,
  or the Organization's new brand, is a new tag in the `design-system`
  dependency, `bun install` and `bun run check`; read the release's
  changelog for what the module must change. `src/styles/theme.css` maps
  Starlight onto the design system's roles and `src/styles/knowledgebase.css`
  lays the pages out with its tokens; neither names a colour of its own. Use
  the design system's components (`design-system/astro/<Component>.astro`)
  where the App needs one, as the page title does with `Badge`. An
  Organization's private design system cannot be installed in GitHub Actions
  yet (Lazurio/LazurioPlatform#915); see `docs/adoption.md`.
- **The App.** `app/v2/src/` stays a read-only viewer with no authoring
  interface: people and agents change the content in pull requests.

Before the pull request run, in `app/v2`:

```sh
bun install --frozen-lockfile
bun run check      # astro check, Biome and every test, the build included
```

## When the knowledge base would change generation

It stays `app/v2` for as long as it is pages that people read and that are
changed in pull requests. More pages, more sections, more metadata fields,
better search or a new layout are all changes within the generation. The
knowledge base changes generation only once it has **structured data of its
own**: records with fields that the App itself has to list, filter or write,
not only render.

Examples of what would be such data:

- the decisions as a register that people filter by state, owner and date
  and change in a form, with a draft that someone reviews and publishes;
- a review duty for procedures: every procedure has an owner and a date by
  which it must be confirmed again, and the App shows who is late and lets
  them confirm it;
- the glossary as records that other modules of the Organization read
  through an interface, with approved translations of each term.

Then the records move to repository-db and the App becomes **`app/v3`**, on
the `content` profile with the data layer of `app-data` (repository-db and
Zod), the way `lazurio module create --stack astro-starlight --data` writes
it:

1. A new `app/v3/` appears beside `app/v2/`. `app/v2` stays the default and
   the way back.
2. The records get Zod schemas (the only definition of their shape) and a
   data repository of their own, mounted as `db/`. A migration script reads
   the pages that become records (for example the frontmatter of the
   decisions), validates them with the same schemas, writes the records and
   checks the result: the count of records and every record read back.
   What stays prose stays Markdown.
3. `default_app` in `lazurio.module.json` switches to `app/v3` only on the
   decision of the Organization's Steward or the person, never as a fix.
4. The module keeps at most two generations; after the switch has held, the
   old one is deleted in a pull request (Git history keeps it).

`app/v4` (a Dolt database in the Server services of the Organization's
server) follows `app/v3` only when its records outgrow a data repository:
many people writing at once, or queries across the Organization's modules.
A knowledge base does not start there.

## Taking an update of the template

A newer release of this template reaches an adopted module as a merge of its
tag, never as a copy. In a task worktree of the module:

```sh
git fetch template tag v<version>
test "$(git rev-parse 'v<version>^{commit}')" = "<commit from the Marketplace registry>"
git merge --no-ff -m "Knowledgebase: take template release v<version>" 'v<version>^{commit}'
```

Read the release's `CHANGELOG.md` entry first; it says what changed and what
to do. When files conflict:

- keep the module's identity (`lazurio.module.json`, the `lazurio.runtime`
  id and names) and its content: `data/v2/docs/`, the sections of
  `knowledgebase.json`, `data/v2/public/`;
- keep the module's `design-system` dependency (the Organization's own
  design system and its tag) in `app/v2/package.json`, and run `bun install`
  so that `bun.lock` matches it;
- keep the module's language: when the release changes pages of a language
  the module no longer carries (`data/v2/docs/<other>/`), Git reports them as
  modified on one side and deleted on the other; keep them deleted
  (`git rm -r data/v2/docs/<other>`) and keep the module's
  `knowledgebase.json`, adding to it only what the release adds to the
  module's language;
- take the template's tooling: dependencies, `bun.lock`, configuration,
  `src/`, tests, skills, workflows.

Example pages a release adds or changes arrive only in modules that kept the
`sample` start; a module that started empty deletes them again with
`bun run start:empty`. Then run `bun install --frozen-lockfile` and
`bun run check`, and open a pull request that names the release and its
commit. Declining the pull request keeps the module as it was; an undo is a
reviewed revert, never a reset.

## Releasing the template

This part is for the maintainers of `LazurioTemplates/knowledgebase`. A
release is an annotated tag `v<semver>` on `main` and a GitHub Release; the
Marketplace registry records the full commit of the tag. Creating the tag and
the Release is a Publication and waits for the maintainer's explicit
instruction.

The version is semantic and independent of the generation:

- **major**: an adopted module must change its own files to take it: the
  shape of `knowledgebase.json` or of the frontmatter, renamed sections or
  kinds, moved files, a new generation, a stack profile release that breaks
  code;
- **minor**: new sections of the structure, metadata fields, skills, tools or
  tests, or a stack profile release that needs no change in adopted modules;
- **patch**: fixes, and patch versions of tools for a security fix.

Tool versions change only in two planned ways: a **profile release** of
Lazurio (`YYYY.MM`: new versions of the tools within the generation, for
example TypeScript 7 once `@astrojs/check` supports it) and a **generation
change** (the data layer). Besides these, only a patch version with a security
fix changes. The template adopts a profile release as a release of its own and
names the profile release in `README.md` and `CHANGELOG.md`; adopted modules
take it by merging that tag.

Before a release:

1. Update `CHANGELOG.md` and `version` in `app/v2/package.json`.
2. Refresh the screens in `docs/screenshots/cs/` and `docs/screenshots/en/`
   when the App looks different: the same shots in each language, WebP, 1600
   px wide, taken from the static build of that language at twice the pixel
   density of a 1440 × 900 window and scaled down, invented content only. The
   first file of the registry's list is the Marketplace card.
3. Run `bun run check` and wait for green CI on `main`.
4. On the instruction: `git tag -a v<version> -m "v<version>"`, push the tag,
   `gh release create v<version> --verify-tag`, then a pull request to the
   registry (`Lazurio/marketplace`) with the tag's full commit.
