---
name: knowledgebase-write-procedure
description: "Use when the person asks you to write down how something is done or to change a written procedure (\"write down the procedure\", \"write up how we…\", \"zapiš postup\", \"sepiš, jak se dělá…\", \"tohle dělej vždycky takhle\"). Writes or updates one page in the section for people (processes) or for agents (agent procedures) of the knowledge base, in a pull request."
---

# Write a procedure

A procedure in the knowledge base lets someone who has never done the work
do it correctly. It has an owner, the date someone last confirmed it, and
steps that say who does what and what comes out of it.

## When to use

- "Write down the procedure…", "write up how we…", "zapiš postup…",
  "sepiš, jak se dělá…", "tohle dělej příště takhle".
- A procedure changed and its page no longer matches what people do.

## Steps

1. Work in a task worktree of this module: one change, one branch, one pull
   request. The primary checkout stays on `main`.
2. Search first with the skill `knowledgebase-search`. When a page about the
   procedure exists, update it instead of writing a second one.
3. Choose the section by its kind in `data/v2/knowledgebase.json`
   (`languages.<language>.sections` of the knowledge base's `language`); the
   page goes to `data/v2/docs/<language>/<section>/`:
   - `processes` when people do the work;
   - `agent-procedures` when an agent does it: what it works with, its steps,
     what it never does on its own and how it checks the result.
   Work that people and an agent share gets both: the process for people,
   and the agent's part in agent procedures with a link to the process.
4. Gather what the section's outline asks for (its `index.md`, "Osnova
   stránky"): when the procedure applies and what it produces, who takes
   part, the steps, the checklist. Take it from what the person said and
   from the sources they point to. Ask only for what you cannot find, one
   question at a time. Never invent a step, a role, an amount or a deadline.
5. Write the page from the outline, in the knowledge base's language:
   - the file name is the title in lowercase ASCII words joined by hyphens
     (`jak-prijimame-noveho-kolegu.md`, `welcoming-a-new-colleague.md`);
   - frontmatter `title`, `description`, `owner`, `reviewed` (today, from
     `date -u +%F`) and `sources` (where the procedure comes from);
   - `status: draft` until the person confirms that this is how the work is
     done, then `status: current`;
   - the main point in the first paragraph; numbered steps; links from the
     site root (`/<glossary directory>/<term>/`).
6. Link each term that has a glossary page. A term that needs one gets it
   with the skill `knowledgebase-add-term`.
7. In `app/v2` run `bun run check`. The content rules name every problem
   with the page and what to do.
8. Open a pull request: which procedure, where it comes from, what is still
   unconfirmed. Merging it is Publication: only on the person's instruction.

## Never

- Passwords, keys or other secrets, personal data beyond a work role,
  customers' data or documents.
- A procedure marked `current` that the person has not confirmed.
- An irreversible step (sending, paying, deleting, publishing) that an agent
  procedure lets the agent finish alone: the last step stays with a person.

## Verification

- `bun run check` passes in `app/v2`.
- The page appears in its section of the App (`bun run build`, or the
  preview from the worktree) with its metadata under the title.
