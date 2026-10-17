---
name: ship-pr
description: Carry one change from request to live through a single pull request, with real-use tests that gate the merge ask. Use whenever a change is headed for a PR (an app fix or feature, a skill, prompt, config, infra, harness or docs change), when opening a PR, when asking for review or merge, and on requests like "fix X", "add Y", "build it", "ship this", "merge N" or "merge all". Do not use for questions, explanations, research, or plans the user has not approved yet.
---

# ship-pr

One change, one PR, carried from Anshul's request to live and checked. This
skill owns the order and the gates. Each step it names keeps its own skill.

His words, 2026-10-17: "you keep missing the testing part, i want a skill that
does the entire PR end 2 end", then "real use testS, plural."

## The gates

Never pass a gate early.

- **Plan gate:** no branch, worktree, test or code before he says "build it",
  or tells you outright to skip the plan, for this work. "Fix X", "add Y",
  "ship this" and "do it" are the request, not the go.
- **Test gate:** no merge ask while any real-use test is ❌, unless he has
  accepted that exact gap for this PR.
- **CI gate:** no hand-off while CI is red.
- **Merge gate:** merge only on his word for that PR ("merge N", "merge all",
  "merge the ones you worked on").
- **Done gate:** not done until it is live everywhere it runs and he has
  looked. Green CI, a passing build or a merged PR is not done.

## 1. Goal and acceptance

Before any code, write these in your reply to him:

- **Goal:** one line, in his words.
- **Acceptance:** what he will do next (the URL, command, screen or request)
  and what he must see. For a fix, the exact steps that show the bug today.
- **Where it runs:** every place the change ends up: the app's environments,
  each machine (the MacBook and the Mac Ultra), each harness.

This list decides which real-use tests stage 5 runs.

## 2. Plan, then stop

- Write a plan of eight lines or fewer: the change, the files, the real-use
  tests you will run (named from the stage 5 table), and the cost of any
  fresh-agent test (roughly $2 to $5 each).
- **Stop and wait for "build it".** End your turn with the stage 1 notes and
  the plan. Reading files and reproducing the bug are fine before that;
  creating a branch, a worktree, a test or code is not.
- If he already said "build it" for this exact work, or told you to skip the
  plan, go on. No tickets, phases or docs from a plan before that.

## 3. Set up and coordinate

- Fetch, then work in a new worktree and branch off the remote default branch:
  `git worktree add <path> -b <branch> origin/<default>`. Put it where this
  repo's other worktrees already live (`git worktree list`); with none, use a
  sibling `<repo>-wt/` folder.
- Look for collisions before editing: peer sessions (ListAgents) and open PRs
  with `gh pr list` plus their changed files.
  - Same files in an open PR: stack on it (your PR's base is that branch) or
    wait for it to merge.
  - Send the peer session one short note: what you touch and the merge order
    you propose.
- Never edit another session's worktree or branch.

## 4. Build, test first

- Write a failing test for the behaviour he expects first, then the code, then
  watch the test pass. Test product behaviour, not the implementation.
- Commit small, verified slices.
- Before leaving this stage, search the repo for text that still describes the
  old behaviour (rules, docs, other skills) and fix it in this PR.

## 5. Real-use tests, plural

Run **every row that applies**. Most changes hit more than one row, and every
fix also gets the last row.

| The change touches | Real-use test |
| --- | --- |
| App or UI | Start it, open the exact URL or build he will use, click through his workflow, screenshot and look (`real-workflow-check`, `browser-and-maps`). |
| API or backend | Call the live endpoint in the dev environment, read the real response, check the state it changed. |
| Skill, prompt or other agent-facing text | Run a fresh headless agent (`claude -p` on Opus) from the branch on a realistic request and let it follow the text as written. Run a control request that must not take the new path. Read its transcript for skipped or misread steps, tighten the wording, re-run the failing case. |
| Commands, installers, scripts | Run every command word for word in a throwaway environment (a temp directory or temp HOME), including the update or rollback path. |
| Moved or restyled visuals | Render the original and the new version and pixel-compare them. Explain every difference. |
| Machines, harnesses, config | Apply it, then check the end state on every machine and that the machines match each other (`mac-ultra-access` for the Ultra). |
| Any fix | Reproduce the old bug before the fix, show it gone after, and check one nearby behaviour that could plausibly break. |

Rules:

- A test runs the real thing. Reading code is not a test. A subagent's report
  is a claim until you have checked its evidence yourself.
- If a test cannot run (no login, no device, real money, an outage), mark it ❌
  with the reason. Never drop it, and never swap in a weaker test without saying
  so.
- Record the results as a table and keep the evidence paths:

| Test | How it ran | Result | Evidence |
| --- | --- | --- | --- |
| Old bug gone | reloaded `/orders` after the fix; it shows 12, not 0 | ✅ | `shots/after.png` |
| iPhone layout | no device available | ❌ not run | — |

## 6. Proof

Load `visual-proof` and build the proof page it asks for:

- here.now, **private** ("Only you"); public only on his word for that page.
- The report's **Ask panel on**; `ASK=off` only on his word for that page.
- The opening: three or four bullets with bold key words, then "Your call",
  then "How we checked" with what was not tested.
- Only screenshots you have opened and checked.
- After publishing, check anonymously that the page and `/api/claude-count`
  both return 401.

## 7. Open the PR

- `gh pr create` against the default branch, or the stacked base from stage 3.
- Body: what and why in plain English, the stage 5 table, the proof link, and
  the verification commands. End with the session's attribution lines.
- Comment the proof link on the PR as well.

## 8. CI

- The main thread watches CI (`gh run watch <id> --exit-status`). A subagent
  pushes, reports the run ID and stops (`agent-briefs`).
- Red: fix it, re-run the stage 5 tests the fix touches, push again.

## 9. Hand-off

Send one scannable message:

- one plain-English line on what the PR does;
- the ✅/❌ table;
- the proof link;
- "Say **merge N**."

If anything is ❌, put it first, ask whether he accepts each gap, and end the
message there. Don't mention merging anywhere in that message, not even
"before I ask to merge". Ask for the merge in your next message, once he has
accepted. When several PRs are open, add a short table: PR,
what it does, tested, merge order.

## 10. Merge

- Merge only the PRs he named. "The ones you worked on" means only this
  session's PRs, never a peer's.
- `gh pr merge <N> --merge`. Never squash, never push to the default branch.
- If he names a PR that is already merged, say so with its merge commit; don't
  try again.
- Stacked PRs: merge the base first, then
  `gh pr edit <child> --base <default>`, wait until it reports `MERGEABLE`,
  check its diff no longer contains the base's files, then merge it.

## 11. Land it and check it live

- Ship it everywhere on the stage 1 list.
  - App: wait for the deploy, then re-run the key real-use test on the live URL.
  - Skills from `shootdaj/skills`, on the MacBook and on the Mac Ultra:
    `git pull --ff-only` in the skills checkout, then
    `DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx -y skills update -g -y`. Then check
    each installed `SKILL.md` matches `origin/master` and the two machines
    match each other (`create-skill-ccch`).
- Clean up with `git worktree remove`, only for clean worktrees whose branch
  has merged.
- Report "live everywhere" with the check output. He looks; then it is done.

## What this prevents

Each of these happened on 2026-10-17, before this skill existed:

- He was asked to merge before the skill routing and the install instructions
  had been run; the fresh-agent tests run afterwards found real gaps.
- A proof page shipped with the Ask panel switched off without asking him.
- Proof pages were published publicly.
- Text that contradicted the change was found only after the PR was opened.
- Stacked PRs had to be retargeted by hand after their base merged.
