---
name: real-workflow-check
description: Checklist for building, fixing or testing anything that shows people data, run against the real app and real data. Use before changing or claiming a fix for lists, filters, search, pagination, load-more, grouping, stacks, collapsed or aggregated records, counts, sorting, async or data loading, or any data-driven UI; when two endpoints could serve the same screen; and whenever asked to test user-facing work, a feature, a screen or a CLI as a user would.
---

# real-workflow-check

Implementation-shaped tests and seeded happy paths don't prove these bugs fixed. Run this checklist in order. These rules are as binding as AGENTS.md; the tests rules there (a failing test first, a regression test plus a negative or adjacent check for every fix) still apply.

## 1. State the contract first

Before changing behavior, write the contract in plain terms:

- the action and the visible result he expects;
- the source of truth (DB rows, API counts, files, jobs, logs, persisted state);
- the nearby behavior that must not change.

## 2. Run it for real

- Verify the exact URL/action in the running local app.
- Use real local data, or the closest realistic dataset.
- Don't trust implementation-shaped tests or seeded happy paths alone.

## 3. Compare against the source of truth

Data-driven UI → compare what the screen shows to the source of truth. Check the contract, not "some result appears":

- total/count semantics;
- has-more/pagination;
- collapsed vs expanded groups;
- false-positive exclusion;
- selected filters;
- visible labels;
- sort order.

Grouped, collapsed, summarized or aggregated records → prove the group-level behavior. Seeing the child records isn't proof.

## 4. Two endpoints, one screen

Two endpoints can serve similar UI → identify their contracts before choosing. Never silently swap broad-listing / ranked-search / cached / preview / mock paths.

## 5. Asked to test user-facing work

Test the real product with current code running, not just the test suites. Exercise the affected UI or CLI, including the likely follow-ons:

- scroll / load-more;
- pagination;
- filter and sort changes;
- clearing filters;
- refresh and back navigation;
- empty and error states;
- live updates.

Compare the visible values to the source of truth (API, DB, files, jobs, logs). The final response lists the concrete paths tested with before/after results, and names any affected path left untested; an untested path means no claim of full completion.
