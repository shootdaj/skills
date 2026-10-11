---
name: agent-briefs
description: How to brief subagents and run long jobs for Anshul without losing work or burning time on CI. Use before launching, briefing or writing a prompt for any subagent, background agent, fork or worker; before any long-running task (research, extraction, scraping, listings, bulk edits, multi-page saves to Notion, Linear or files); and right after an agent or the main thread pushes code whose CI run needs watching.
---

# agent-briefs

Two things go into every brief. These rules are as binding as AGENTS.md.

## 1. Agents never watch CI

- Every brief that may push code says: push, report the CI run ID, stop. The agent never waits on or polls CI.
- The main thread watches the run in the background: `gh run watch <id> --exit-status`.
- On red, the main thread resumes that same agent with the failing job's log tail.

## 2. Long tasks save progressively

A long task saves to the requested target (Notion, a file, or another destination) as it goes, never only at the end. Save-at-end plus a mid-run failure loses the useful work.

Put this pattern in the brief:

- "After each item (listing, page, result) is extracted, immediately append it to [target]."
- "Don't batch; save incrementally. 3 partial results beat 0 if the run dies."
- "Mark unfinished sections 🔄 in progress, so a crash shows what's incomplete."
