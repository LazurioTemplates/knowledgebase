---
title: How to write in the Knowledgebase
description: What belongs here, what a good page looks like and how the content changes, for people and agents.
sidebar:
  label: How to write in the Knowledgebase
---

A knowledge base is only useful when people trust it. That is why every page
has one subject, a person or role responsible for it, and the date someone
last confirmed it. Changes are reviewed before they become valid.

## What belongs here

The Organization's lasting knowledge, which should hold longer than a single
task: how the Organization works, who is responsible for what, proven
procedures, terms, and decisions with their reasons.

## What does not belong here

- Passwords, keys, credentials and other secrets. They belong in the vault.
- Personal data beyond a work role: private contacts, health information,
  evaluations of people.
- Customers' data and documents.
- Tasks and plans in progress. They belong in the planning tool, for
  example Mission Control.
- Raw sources such as meeting transcripts or exports. Only what was
  confirmed from them is written here, with a link to the source.

## A good page

- **One subject.** When a page describes two things, split it in two.
- **The main point first.** The first paragraph says the main thing. The
  details follow below it.
- **A title people search for.** The page's title is what someone would type
  into the search. The file has the same name in lowercase, with words joined
  by hyphens (`welcoming-a-new-colleague.md`).
- **Links instead of repetition.** Explain a term once in the Glossary and
  link to it elsewhere, for example `[experiment](/glossary/experiment/)`.
- **The section's outline.** Every section has an outline on its overview
  page; write by it.

## Page details

Every page starts with a header between two `---` lines. Only the title is
required.

| Detail | Meaning |
| --- | --- |
| `title` | The page's title. Required. |
| `description` | One sentence about what the page holds. Shown right under the title. |
| `status` | `draft` (being written, not valid yet), `current` (valid), `outdated` (kept for history). |
| `owner` | The role or person who keeps the page true. |
| `reviewed` | The date someone last confirmed the page against reality, as `2026-11-06`. |
| `aliases` | Other names people use for the same thing. Search finds them too. |
| `sources` | Where the knowledge comes from: a link, a document, a meeting. |
| `decided`, `decided_by` | For a decision: when and who decided. |
| `superseded_by` | For a decision that is no longer valid: the path of the decision that replaced it, for example `decisions/0002-new-procedure`. |
| `sample` | `true` on an example page of the template. The empty start removes it. |

The title is the page's heading and the description the line under it. The
other details stand under the description: the status, who keeps the page
true, when it was last reviewed, other names, sources, and for a decision who
decided, when and what replaced it. An example page also has the "Example"
banner at the top. A page with a wrong detail is not built, and the check
points it out before the change reaches people.

## How the content changes

The knowledge base is a Git repository. Every change is a pull request that
someone reviews. It becomes valid once the Organization accepts it. An agent
prepares a change but never accepts it itself. The Organization's rules for
approvals apply here too.

Do not delete what is no longer valid right away. Mark it `status: outdated`
and say what applies instead. Decisions are never deleted. The whole history
stays in Git.

## With your agent

| You say | Your agent |
| --- | --- |
| "How do we…?" | Searches the knowledge base, answers and names the page the answer comes from. When it finds nothing, it says so and offers to write the answer down. |
| "Write down the procedure for…" | Checks whether the procedure is already written down, asks for the missing steps and prepares a page in Processes and procedures or Procedures for agents. |
| "Record the decision that…" | Prepares a page in Decisions with who decided and when, why and what follows from it. It marks an earlier decision that the new one replaces as outdated. |
| "Add the term … to the glossary" | Checks that neither the term nor another name for it is in the Glossary yet, and prepares its page. |

The agent follows the module's skills in the repository's `.agents/skills/`
directory.

## Examples and the empty start

Pages with the "Example" banner describe an invented Organization, Example.
They show what a finished page looks like in every section. Replace them with
your own content, or remove them all at once with `bun run start:empty` in
the `app/v2` folder. The structure, which is this page and the section
overviews, stays.
