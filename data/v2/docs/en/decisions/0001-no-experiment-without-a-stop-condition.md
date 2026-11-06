---
title: 0001 No experiment without a stop condition
description: Every experiment has its stop condition written down before it starts, and management approves its launch.
sample: true
status: current
decided: 2026-09-15
decided_by: Example management
---

## Context

Example's first two [experiments](/glossary/experiment/) ran longer than was
useful. Nobody had said beforehand which result meant "stop", so they went on
out of inertia. Time and budget were spent that were missing elsewhere.

## Decision

An experiment starts once its hypothesis, metric, budget and stop condition
are written down. Management approves the launch and the budget. When the
stop condition is met, the [experiment lead](/people-and-roles/experiment-lead/)
ends it without another meeting.

## Consequences

- The plan of an experiment in Mission Control has the stop condition as a
  required part.
- When an agent prepares an experiment, it proposes the stop condition, and
  the experiment lead confirms it.
- An ended experiment is not a failure when it brought a recorded result.

## Options considered

- **A fixed length for every experiment (for example four weeks).** Rejected:
  some hypotheses can be tested in two days, others need two months.
- **Deciding whether to continue at the weekly review.** Rejected: the review
  would deal with single experiments instead of the whole, and the decision
  would be put off.
