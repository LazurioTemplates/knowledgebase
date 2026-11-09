---
title: Decisions
description: What was decided, who decided and when, why, and what follows from it.
sidebar:
  label: Overview
  order: 0
---

This section is the Organization's memory of its decisions. Whoever asks a
year from now "why do we do it this way?" finds the answer here, together
with who decided and when.

## What belongs here

- Decisions that change how the Organization works, what it offers or who
  may do what. Each has its own numbered page.
- Decisions that are no longer valid. They are not deleted: they get
  `status: outdated` and a `superseded_by` link to the decision that
  replaced them.

A proposal still under discussion has `status: draft`. It becomes a decision
once whoever decides the matter approves it.

## Outline of a page

The file is named by the number and a short name, for example
`0002-quotes-are-approved-by-management.md`.

```markdown
---
title: <number> <the decision in one sentence>
description: <what was decided, in one sentence>
status: current
decided: <date of the decision, YYYY-MM-DD>
decided_by: <who decided: a role or a name>
---

## Context

<Why a decision was needed.>

## Decision

## Consequences

## Options considered
```
