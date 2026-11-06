---
name: knowledgebase-search
description: "Use before you answer how the Organization works: a process or procedure, who is responsible for what, what a term means, what was decided and why (\"how do we…\", \"who is in charge of…\", \"what does … mean\", \"jak u nás…\", \"kdo má na starosti…\", \"co znamená…\"). Search the knowledge base first and name the page you rely on; never answer from memory what the knowledge base can say."
---

# Search the knowledge base before you answer

The knowledge base is the Organization's own record of how it works. An
answer about the Organization that does not come from it, or that contradicts
it, is a guess. This skill finds the page, checks that it is valid and names
it in the answer.

## When to use

- The person asks how something is done, who decides or is responsible, what
  a word means, or why something is the way it is.
- You are about to act on an assumption about the Organization's processes,
  roles or rules.
- Before you write a procedure, a decision or a term: the other skills of
  this module start here, so that nothing is written twice.

Not for general knowledge that has nothing to do with the Organization.

## Where to look

- `data/v2/knowledgebase.json` of this module names the knowledge base's
  `language` (`cs` or `en`). The pages are Markdown in
  `data/v2/docs/<language>/`. In an Organization's root checkout the module
  is mounted at `workspace/<module>/`, so the pages are in
  `workspace/<module>/data/v2/docs/<language>/`.
- `languages.<language>.sections` in the same file lists the sections and
  their `kind`: `organization`, `roles`, `processes`, `agent-procedures`,
  `glossary`, `decisions`, and `other` for sections of the Organization's
  own. Find a section by its kind, not by its directory name; an
  Organization may rename directories.
- Every section's `index.md` says what belongs there.

## Steps

1. Turn the question into search words in the knowledge base's language: the
   subject, its other names, and a stem that matches the inflected forms
   (Czech changes word endings: search `zakázk` to find zakázka, zakázky,
   zakázce). Search with and without diacritics when the first finds nothing.
2. Search titles, other names and headings first:

   ```sh
   rg -i -n '^(title|aliases):.*<stem>' data/v2/docs/<language>
   rg -i -n '^#{1,3} .*<stem>' data/v2/docs/<language>
   ```

3. Then the text: `rg -i -l '<stem>' data/v2/docs/<language>`.
4. Read every page you found to the end, and the glossary page of each term
   the question depends on.
5. Read the page's frontmatter before you trust it:
   - `sample: true`: an invented example of the template (the Organization
     "Example"). Never an answer about this Organization.
   - `status: draft`: written but not confirmed; say so.
   - `status: outdated`: no longer valid; follow `superseded_by` or say what
     replaced it.
   - `reviewed`: when someone last confirmed it. Say the date when the answer
     depends on it and it is older than a few months.
6. Answer with the page: its title and path
   (`data/v2/docs/<language>/<section>/….md`), and the sentence your answer
   rests on. Answer in the language the person speaks to you, even when the
   knowledge base is in the other one.
7. When nothing answers the question, or two pages disagree, say exactly that.
   Do not fill the gap with a guess. Offer to write the answer down once the
   person gives it (skills `knowledgebase-write-procedure`,
   `knowledgebase-record-decision`, `knowledgebase-add-term`).

## Precedence

The person's current instruction and the Organization root's `AGENTS.md`
come first. Within the knowledge base a decision wins over an older page that
contradicts it; report the contradiction so that the page gets fixed.

## Verification

- The answer names the page it rests on, or says that no page answers it.
- No example page (`sample: true`) is presented as a fact about the
  Organization.
