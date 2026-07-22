---
name: recap
description: "Use when the user returns after time away and needs to be brought back up to speed fast. Triggers: 'recap', 'catch me up', 'bring me up to speed', 'where are we', 'what's the status', 'what did I miss', 'I've been gone/away', 'what actual work was done'. Produces a brief, current-task-focused status — long-term goal, current task, concrete recent progress, what's live, and what's blocked on the user. Plain English, lists/tables, no walls of text, no cryptic references."
---

# /recap — bring me back up to speed

Goal: orient the user in ~15 seconds of reading after they've been away. **Brief. Current-task-focused. Plain English. Concrete.**

## Steps

1. **Gather real state — don't recap from memory. Check reality:**
   - **Long-term goal:** the active `/goal`, or `ROADMAP.md` / `PROJECT.md` / the plan or spec of record. One line.
   - **What's left for the goal:** compare the goal's acceptance criteria / roadmap / open tasks against what's actually done. List the remaining items to reach the goal — concrete, plain English. If it's genuinely done, say so.
   - **Current task:** the in-progress task (task list), active phase, or the last thing being worked on.
   - **Recent work:** `git log --oneline -15` and `gh pr list --state all --limit 8` (or the platform's equivalent). Open each recent/merged PR enough to know **what it actually did**.
   - **Live state:** if anything is deployed or running, check it for real — health endpoint, `fly status`/`docker ps`, the running URL. Report what works *right now*, not what should.
   - **Blocked on the user:** approvals, secrets/keys, decisions, anything waiting.
2. **Decode every reference.** Never leave a bare "PR #7", "MAK-20", "wave 3", or a commit hash — say what it *is* ("the wallet-login work", "the scanner that fills the feed"). No cryptic numbers or internal codenames without a plain gloss.
3. **Emit the template below.** Keep it to about one screen. Lists and tables only — no paragraphs, no walls of text.

## Output template

```
**Goal:** <the long-term objective, one line>
**Right now:** <the current task, one line>

**Done since you left**
- <plain-English — what it does, not its number>
- …

**Left for the goal**
- <remaining item to reach the goal, plain English>
- … (or "goal is met" if nothing remains)

**Next step**
- <the single immediate next action>

**Live / working**
| thing | status |
|---|---|
| …    | …      |

**Needs you**
- <anything blocked on the user, or "nothing — I can keep going">
```

## Rules

- **Brief beats complete.** Lead with the current task; collapse older work into a line or two.
- **Plain English.** No jargon, no acronyms without a gloss.
- **Concrete.** State what PRs / commits / tickets *contain*, never just their identifiers.
- **Verified, not remembered.** Base it on git / deploy / test output; explicitly flag anything you couldn't confirm.
- If there's no clear goal or task list, say so plainly and give the best picture from git + recent activity.
