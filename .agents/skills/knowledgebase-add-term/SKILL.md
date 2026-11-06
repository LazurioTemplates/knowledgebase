---
name: knowledgebase-add-term
description: "Use when the person asks you to add a word to the glossary or to explain a term of the Organization for good (\"doplň do slovníku\", \"co znamená…? zapiš to\", \"tomu u nás říkáme…\"), or when a page you write uses a term the glossary does not have. Adds or updates one glossary page with the definition, other names and what not to confuse it with, in a pull request."
---

# Add a term to the glossary

The glossary keeps the meaning of the words the Organization decides, pays
or acts by. Each term has one page; its other names are listed on it, so that
search finds the page under any of them and no term is defined twice.

## When to use

- "Doplň do slovníku…", "tomu u nás říkáme…", "co znamená…? zapiš to".
- A procedure or decision you write uses a term that has no glossary page.

## Steps

1. Work in a task worktree of this module, or in the pull request of the page
   that needs the term.
2. Search the section of kind `glossary` (see `data/v2/knowledgebase.json`)
   for the term and its other names in titles and `aliases`, with a stem that
   matches its inflected forms:

   ```sh
   rg -i -n '^(title|aliases):.*<stem>' data/v2/docs/<glossary directory>
   ```

   When the term exists, update its page (a missing alias, a better example)
   instead of writing a new one.
3. Get the meaning from the person or from a source they point to. Never
   define a term of the Organization from general knowledge alone; when the
   Organization uses a common word differently, that difference is the point.
4. Write `<glossary directory>/<term in lowercase ASCII with hyphens>.md`
   from the outline in the section's `index.md`:
   - `title`: the term as people write it (nominative singular);
   - `description`: the definition in one sentence;
   - `aliases`: other names, abbreviations, the English word people use;
   - `owner` and `reviewed` (today, from `date -u +%F`);
   - the definition, "Příklad" and "Nezaměňovat s".
5. Link the term from the pages you are changing anyway
   (`[pojem](/<glossary directory>/<term>/)`).
6. In `app/v2` run `bun run check`. The content rules refuse a term or alias
   that another glossary page already has. Then open the pull request;
   merging it is Publication, only on the person's instruction.

## Verification

- `bun run check` passes.
- Search in the App finds the term under its title and under each alias.
