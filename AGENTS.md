# Knowledgebase: rules for agents

This repository is the knowledge base module of an Organization: its
procedures, knowledge, glossary and decisions, for people and agents. In the
template the content describes an invented Organization, Example. These rules
add to the Organization root `AGENTS.md`.

## Skills of this module

Use them; each says when it applies, its steps and how to verify the result.
They live in `.agents/skills/` (Codex) and `.claude/skills/` (Claude Code).

| You are asked | Skill |
|---|---|
| How the Organization works: a process, a role, a term, a decision, a reason | `knowledgebase-search`: search here first and name the page you rely on |
| "Write down the procedure", "zapiš postup" | `knowledgebase-write-procedure` |
| "Record the decision", "zapiš rozhodnutí" | `knowledgebase-record-decision` |
| "Add … to the glossary", "doplň do slovníku" | `knowledgebase-add-term` |

Edit a skill in `.agents/skills/` and copy the changed directory to
`.claude/skills/` in the same pull request; the tests fail when the two
differ.

## The content

- The knowledge base has one language, `language` in
  `data/v2/knowledgebase.json` (`cs` or `en`); its pages live only in
  `data/v2/docs/<language>/`, in the sections the same file declares for that
  language. Write in that language, whatever language the person speaks to
  you. Find a section by its `kind` (`organization`, `roles`, `processes`,
  `agent-procedures`, `glossary`, `decisions`, or `other` for the
  Organization's own), not by its directory.
- In the template both languages carry the same structure and example. Keep
  them the same: a change of a structure page or an example in one language
  is made in the other in the same pull request.
- One page, one subject. The file name is lowercase ASCII words joined by
  hyphens; the title is what people would search for. Every section's
  `index.md` holds the outline of a page; follow it.
- Frontmatter: `title` always; `description`, `status` (`draft`, `current`,
  `outdated`), `owner`, `reviewed`, `aliases`, `sources`; for a decision
  `decided`, `decided_by` and, once replaced, `superseded_by`
  ([`ARCHITECTURE.md`](ARCHITECTURE.md)).
- Links go from the site root: `/slovnik/experiment/`,
  `/glossary/experiment/`. A page of the Organization's own never links to an
  example page.
- Write in the voice the Organization root prescribes.
- A page you write is `status: draft` until the person confirms it. Never
  record a procedure, a decision or a definition that nobody confirmed, and
  never fill a gap with a guess: ask, or leave the gap visible.
- Never write secrets, personal data beyond a work role, or customers' data
  and documents into the knowledge base. Plans and tasks belong in the
  Organization's planning (Mission Control), raw sources in their own
  modules; bring only the confirmed result here and link the source.
- Pages with `sample: true` are the template's invented example. Never
  present them as facts about the Organization. `bun run start:empty`
  removes them all and `bun run start:language <cs|en>` keeps one language;
  run either only on the person's instruction.

## Lazurio Module Standard

- One repository is one module; the App lives in `app/v2/` and only reads
  `data/v2/`. It has no authoring interface: people and agents change the
  content in pull requests.
- `dev` starts one Astro server; `prepare:app` (`astro sync`) is the
  preparation and `check:prepared` checks it.
- Opened from `main`, the App runs as its static build (`build_output:
  "dist"`). `build` must succeed without the listener and write
  `dist/index.html` for the health path `/`; the build test checks it.
- The App reads its host and port only from
  `LAZURIO_RUNTIME_LISTENER_APP_HOST` and `_PORT` through `@lazurio/module-kit`
  and exits with code 2 without them. The port lives only in
  `lazurio.module.json`.
- No `.env*` files, secrets or imports from outside this repository. The
  design system arrives as a locked copy in `app/v2/src/design-system/`
  (`lock.json`), taken by `bun run design-system:sync -- <checkout> <tag>`;
  never edit the copy or `src/styles/theme.css` by hand.
- One change, one worktree, one branch, one pull request; the primary checkout
  stays on `main`. Merging is Publication: only on the person's instruction.

## Template

This repository is a public template of the Marketplace of Lazurio (MIT,
`LICENSE` and `NOTICE`), published by LazurioTemplates. Everything in it must
stay publishable:

- only the invented Organization Example; never a real company's content,
  people, customers or data;
- every text for people in Czech and in English, the same in both; the
  Marketplace screens in `docs/screenshots/cs/` and `docs/screenshots/en/`,
  the same shots;
- the App stays generation `app/v2` on the content stack profile with exact
  versions; tool versions change only in a stack profile release or a
  generation change ([`docs/extending.md`](docs/extending.md));
- a change that adopted modules must follow in their own files (the shape of
  `knowledgebase.json` or of the frontmatter, moved files) is a major release
  and says what to do in `CHANGELOG.md`;
- keep `docs/adoption.md` and `docs/extending.md` true when you change what
  they describe, and refresh `docs/screenshots/` when the App looks
  different;
- tags, GitHub Releases, merges and the registry entry are Publication: only
  on the maintainer's explicit instruction.

## Verification before a pull request

```sh
cd app/v2
bun install --frozen-lockfile
bun run check      # astro check, Biome and every test, the build included
```

When a content rule fails, the test names the page and what to do. In the
Organization, once the change is merged and the module is checked out on
`main`, Lazurio runs it as its build:
`lazurio module build <Organization>/<module> --json` builds the commit and
`lazurio module start <Organization>/<module> --json` returns `runtime.url`;
`lazurio module status` and `lazurio module logs` say why when it does not.
