---
name: knowledgebase-record-decision
description: "Use when the person tells you that something was decided or asks you to record a decision (\"zapiš rozhodnutí\", \"rozhodli jsme, že…\", \"od teď platí…\"). Writes a numbered decision page with who decided, when, why and what follows, marks the decision it replaces as outdated, in a pull request of the knowledge base."
---

# Record a decision

A decision page answers "why do we do it this way?" a year later: what was
decided, by whom and when, why, what follows from it and what else was
considered. Decisions are never deleted; a newer one replaces an older one.

## When to use

- "Zapiš rozhodnutí…", "rozhodli jsme, že…", "od teď platí…".
- A conversation ends with a decision that changes how the Organization
  works, what it offers or who may do what.

## Steps

1. Work in a task worktree of this module: one change, one branch, one pull
   request.
2. Search the section of kind `decisions` (see `data/v2/knowledgebase.json`)
   and the rest of the knowledge base with `knowledgebase-search`: an earlier
   decision on the same subject, and the pages the decision changes.
3. Make sure it is a decision: who decided and when. Record only what the
   person who decides has decided. A proposal still under discussion is
   written with `status: draft` and no `decided`; never present it as decided.
4. Number it: the highest four-digit number in the section plus one. The file
   is `<number>-<short-name>.md` (`0002-nabidky-schvaluje-vedeni.md`).
5. Write the page from the outline in the section's `index.md`:
   - `title`: the number and the decision in one sentence;
   - `description`, `status: current`, `decided` (the date of the decision,
     `YYYY-MM-DD`, not the date you write it down), `decided_by` (the role or
     name of who decided);
   - "Souvislosti", "Rozhodnutí", "Důsledky", "Zvažované možnosti", in the
     person's words; ask for the reasons when you do not know them.
6. When it replaces an earlier decision: in the earlier page set
   `status: outdated` and `superseded_by: <decisions directory>/<new file
   without .md>`, and leave its text as it was.
7. Update the pages the decision changes (a procedure, a role) in the same
   pull request, or list them in the pull request when someone else owns them.
8. In `app/v2` run `bun run check`, then open the pull request. Merging it is
   Publication: only on the person's instruction.

## Verification

- `bun run check` passes; the content rules hold the number, the date, who
  decided and the link to a replaced decision.
- The earlier decision, if any, says `outdated` and links to the new one.
