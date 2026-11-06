# Adopting the knowledge base into another Organization

This guide is for the agent that adopts this template for a person, usually
after "Přidat do Organizace" in the Marketplace of Lazurio handed it a brief
with the exact release, the target Organization, the start and how the module
starts. Adoption is an agent's reviewed work in pull requests, not an
installer. The person decides; the agent prepares.

The result is a private module of the target Organization whose history
contains the release's commit as an ancestor, with the target's identity
(name, lease, Teams), its language, the start the person chose, and an
Organization root that points its agents to the knowledge base. Later releases of the template
reach it as ordinary merges (see
[Taking an update](extending.md#taking-an-update-of-the-template)).

## What you need before you start

- The **release**: its tag `v<version>` and the full commit the tag points to,
  both from the brief or the Marketplace registry. A tag alone is not an
  immutable identity: fetch the tag and confirm that it resolves to that
  commit. If it does not, stop and report it.
- The **target Organization**, as the person named it. Never pick another one
  or a personal account instead.
- The **language**: the language of Lazurio for the Organization, Czech
  (`cs`) or English (`en`). It is the `locale` of the Folder's profile
  (`<Folder>/.lazurio/preferences.json`, `profile.locale`), the language the
  Folder's `AGENTS.md` and the Marketplace brief are written in. Lazurio does
  not pass it to the module itself yet (Lazurio/LazurioPlatform#909), so the
  adoption records it (step 7). When the brief and the profile disagree, ask.
- The **start**: `sample` keeps the invented Organization Example (one page
  in every section) to explore the knowledge base; `empty` removes it and
  keeps only the structure (step 7). When the brief does not say, ask.

## 1. Read the target's rules

Open the target Organization's root checkout and read its `AGENTS.md`, its
`lazurio.organization.json` and the nearest rules for modules. They apply
inside its checkout and win over this guide where they are stricter
(language, branch names, review). Work in a task worktree of the Organization
root, never in its primary checkout.

## 2. Check live rights

Rights come from GitHub now, not from a checkout:

```sh
gh api user --jq .login
gh api orgs/<Organization>/memberships/<login> --jq '.role,.state'   # admin, active
gh api repos/LazurioTemplates/knowledgebase --jq .visibility         # public
```

`lazurio module create` for an Organization is run by an active Owner (admin)
of that Organization. When the person is not one, do not look for another
way: prepare the plan and a short request for an Owner (who and what to run),
record it as an issue in the Organization's root repository, give the person
its URL and stop there.

## 3. Check the name

The template's module id is `knowledgebase`. Many Organizations already keep a
knowledge base, so look for a collision, letter case ignored, before you
propose the name:

- a slot or directory `knowledgebase` in the target's `modules.manifest.json`,
  `workspace/` or the root;
- a repository `<Organization>/knowledgebase` on GitHub
  (`gh api repos/<Organization>/knowledgebase`).

When the name is taken, do not reuse or overwrite anything. Tell the person
what exists and what the choices are:

- **A trial beside it** under another slug, for example
  `knowledgebase-example`, with the `sample` start, to see the template
  before deciding anything.
- **Moving the existing knowledge base onto the template** is not an
  adoption: it changes a module people already use (its pages move into the
  sections of `data/v2`, its App is replaced). It needs its own plan, agreed
  with the person, and its own pull request in that module; this guide does
  not do it.

If the existing module is already an adoption of this template, this is an
update, not an adoption: follow
[Taking an update](extending.md#taking-an-update-of-the-template) in that
module instead.

## 4. Check compatibility

- Lazurio on the Environment runs Apps declared with `lazurio.runtime.v1` and
  `lazurio.preparation.v1` and fetches the Bun the App pins (`packageManager`,
  `bun@1.4.4` in this release). `lazurio module list <Organization> --json`
  must list the Organization's modules.
- The App is static (`build_output: "dist"`) and declares no secrets and no
  siblings, so it needs nothing from the target besides a port of its pool.

## 5. Show the plan, then create the module

Run the generator as a dry run and show the person the plan together with
what follows from it (the private repository, the Teams that get Write, the
port, the release you will merge):

```sh
lazurio module create <Organization>/<slug> --stack astro-starlight --teams <team,team> --dry-run --json
```

Leave out `--data`: the knowledge base has no data layer of its own, its
pages live in the module's own repository (`app/v2`, see
[extending.md](extending.md#when-the-knowledge-base-would-change-generation)),
and the release replaces the scaffold's `app/v1` in step 6. Teams come from the Organization's real list; ask the person which ones, and
never invent one. Only after the person confirms the plan, run it with
`--confirm <plan>` from the task worktree of the Organization root. The run
creates the private repository, places the module in `workspace/<slug>`,
pushes `main` and declares the slot in the worktree's `modules.manifest.json`.
Commit that; the root's pull request also gets the pointer of step 8.

## 6. Merge the release so it stays an ancestor

In a task worktree of the new module (`git worktree add`, a branch of its own):

```sh
git remote add template https://github.com/LazurioTemplates/knowledgebase.git
git fetch template tag v<version>
test "$(git rev-parse 'v<version>^{commit}')" = "<commit from the brief>"
git merge --allow-unrelated-histories --no-ff -m "Knowledgebase: adopt template release v<version>" <commit>
```

Never squash, rebase or copy the files instead: the merge keeps the release as
an ancestor, and that is what lets a later release merge cleanly. The
scaffold wrote its App to `app/v1/`; the template's App is `app/v2/` with its
content in `data/v2/`. Resolve the files like this:

| File | Keep from the scaffold | Take from the template |
| --- | --- | --- |
| `lazurio.module.json` | `id`, `company`, `port_leases` | `apps`, `default_app` (both `app/v2/package.json`) |
| `app/v1/` | nothing: delete the directory (`git rm -r app/v1`) | |
| `app/v2/package.json` | `lazurio.runtime`: `title`, `company`, `module`, and the `id` of the scaffold with its last segment `-v1` changed to `-v2` | everything else: `name`, `version`, scripts, exact dependencies, `packageManager`, `build_*`, `static_fallback`, `tags`, `description`, the listener, `preparation` (`owner_package` `app/v2/package.json`) |
| `app/v2/bun.lock` | | the template's; `bun install --frozen-lockfile` confirms it is current |
| `app/v2/` (configuration, `src/`, `tests/`) and `data/v2/` | | the template's |
| `.agents/skills/`, `.claude/skills/` | | the template's |
| `README.md`, `AGENTS.md`, `ARCHITECTURE.md` | | the template's, then adapt them (step 7) |
| `.github/workflows/`, `.gitattributes`, `.gitignore` | | the template's |
| `.github/CODEOWNERS` | the target's Team, or no file when the Organization does not use one | |

## 7. Make it the Organization's own

**Identity** (always): in `README.md` and `AGENTS.md`, the Organization's
name, and one line saying that the module was adopted from
`LazurioTemplates/knowledgebase` at `v<version>` (`<commit>`). Keep `LICENSE`
and `NOTICE`; they are the template's license and attribution, which MIT
requires to stay with the copy. Add a copyright line of your own to `NOTICE`
for your changes if you want one.

**The language** (always): the template carries the structure and the
example in Czech and in English; the knowledge base keeps the Organization's
language only, so that people and agents write into one tree:

```sh
cd app/v2
bun run start:language <cs|en> --dry-run
bun run start:language <cs|en>
```

It sets `language` in `data/v2/knowledgebase.json` and removes the other
language's pages (`data/v2/docs/<other>/`) and structure. The App then shows
its interface and pages in that language only.

**The start:**

- `sample`: keep the example pages. Each carries a banner saying that it is
  invented, and agents never take them as facts about the Organization.
- `empty`: in `app/v2` run `bun run start:empty --dry-run`, then
  `bun run start:empty`. Only pages with `sample: true` go; the home page, the
  guide and the overview of every section with its outline stay.

**The look:** the template carries a locked copy of the tokens of
`LazurioTemplates/design-system` v1.0.0 (the invented Example brand). When
the Organization has its own design system module (adopted from that
template, so with the same `content/brand/colors/tokens.json`), take its look
from a checkout of it at its newest commit on `main` or its release tag:

```sh
cd app/v2
bun run design-system:sync -- <path to the design system checkout> <tag or commit>
```

The command reads the files from that commit (not from the working tree),
copies the tokens unchanged, records the repository, the commit and the
SHA-256 in `src/design-system/lock.json`, regenerates the theme and the
favicon, and names any adapted file whose source changed. Nothing is fetched
and nothing is read at run time; a newer design system reaches the knowledge
base only by running the command again in a pull request. The tests fail when
a text colour of the new theme does not reach WCAG AA contrast on its
surface; then the design system needs fixing, not the knowledge base. Without
a design system of its own, keep the copy and say so in the pull request.

**The glossary:** when the Organization root keeps its own glossary
(`GLOSSARY.md`), agree with the person which one is the authority. Two places
for the same terms drift apart. Either the terms move into the Slovník of the
knowledge base and `GLOSSARY.md` points there, or `GLOSSARY.md` stays and the
Slovník overview links to it.

## 8. Point the Organization's agents here

Agents start in the Organization root and do not see this module's skills by
themselves. In the root's pull request of step 5, add to the root `AGENTS.md`
(in its own words and language, beside its list of where to write what):

```markdown
- How the Organization works (a process, a role, a term, a decision): search
  the knowledge base `workspace/<slug>/data/v2/docs/<language>/` before
  answering and name the page, as its skill `knowledgebase-search` says
  (`workspace/<slug>/.agents/skills/`).
- A procedure, a decision or a term is written there with the skills
  `knowledgebase-write-procedure`, `knowledgebase-record-decision` and
  `knowledgebase-add-term`, in a pull request of the module.
```

When the root already has a line for its knowledge base (for example
"strategy and guardrails: `workspace/knowledgebase/`"), extend it instead of
adding a second one.

## 9. Verify

In the module's task worktree:

```sh
cd app/v2
bun install --frozen-lockfile
bun run check      # astro check, Biome and every test, the build included
git merge-base --is-ancestor <commit> HEAD && echo ancestor
```

Open the module's pull request with what you did, what you verified, the
merged release and commit, the language, the start, the design system the
look comes from, and what is left. After both pull requests are merged and the module is
checked out on `main`, `lazurio module setup` must report it `current`, and
`lazurio module start <Organization>/<slug> --json` returns the URL to open.
A preview before the merge is not proof that the module runs in the
Organization.

## 10. Access for Teams, last

Who may open the module follows the Organization's manifest and live GitHub
grants, set the same way as for every other module of the Organization
(Přehled Organizace). The Marketplace grants nothing and keeps no list of its
own. Change access only as the last step and only on the person's
instruction.

## What you never do

- merge, tag, publish, change a repository's visibility or start anything for
  others without the person's explicit instruction;
- force-push, delete a branch, repository or data, or reset a protected
  branch; a failed or partial adoption keeps its worktree and tells the person
  exactly where to resume;
- overwrite or move an existing knowledge base as part of an adoption;
- read files of this template repository or of the design system at run
  time: the module is a copy that takes updates by merge.
