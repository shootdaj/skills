---
name: visual-proof
description: Build the proof that work actually functions, for Anshul. Covers the published proof report he tests from (the hand-off) and the visual proof every pull request carries. Use before handing him anything to test or try, before opening a PR, before asking for review or merge, after any UI, visual, layout, browser or user-facing change, and whenever screenshots, recordings, GIFs, a proof manifest or a proof report go into a PR body or a page for him.
---

# visual-proof

Two kinds of proof, one set of screenshot rules. These rules are as binding as AGENTS.md; they live here so they load only when needed.

## 1. The hand-off: a published proof report

Nothing goes to him "to test" until the agent has exercised it on the exact URL, environment and build he will use and watched it work (AGENTS.md, Verify Before Reporting). Then:

- The hand-off is a published proof report, not a message.
- Build it with the `anshul-design` skill (the design-flow engine); use the latest version of that skill.
- Publish it permanently to here.now through the `report-publisher` path. Never a claude.ai artifact, never a hand-rolled page.
- It shows every step he is about to do, working on the surface he will use: a full-width screenshot or a recording (GIF/video) of the real run, the URL under each, and a one-line caption of what he will see.
- No report, no hand-off.

His words, 2026-09-29 (Luminatlas): "use report publisher skill for all these, not claude report"; "use the latest anshul design skill"; "not just click through, make a report with all proofs with screenshots/recordings of said proof. that's the only way I can prove that you've done your due diligence." Clicking through it yourself is not enough without the report.

## 2. Proof in every PR

UI, visual, layout, browser or user-facing changes ship proof that the behavior works in the real app.

- A UI fix isn't done until the proof shows the end-user behavior fixed. Proof shows the request isn't met → reopen, fix, rerun, regather.
- Every UI PR has a proof report on the branch under `docs/proof/<pr-number>/`, referenced in the PR description. The report is part of the deliverable.
- Every PR, UI or not, carries proof in its body or comments before asking for review or merge: embed representative screenshots, videos, GIFs or rendered artifacts. A report path alone isn't enough.
- PR body: report path, scope, verification commands.
- Non-UI work: the strongest observable proof, plus why screenshots don't apply.
- The repo report uses the project's own generator or design language when it has one (a project-specific generator or template wins). The page he tests from is the `anshul-design` hand-off in section 1.
- Binaries too big or sensitive to commit → say so, give a reproducible generation command and a safe location.
- No screenshot possible → say why and capture the strongest browser-derived evidence.

## 3. Screenshot rules (both kinds)

- Primary artifact: a full-resolution, full-screen browser screenshot of the real app state. Before/after when feasible. Crops supplement it; they don't replace it.
- Every screenshot has its captured URL right next to it. A manifest entry without `url` is incomplete proof.
- The screenshot visibly shows the affected UI. A hidden or too-small element isn't proof.
- Display it large (full width or zoom), never as an unreadable thumbnail.
- Layout / overlap / clipping / scroll / tiny-control bugs get a visible highlight or callout, or an annotated duplicate next to the full-screen shot.
- Open every image before using it. Reject splash, blank, broken, wrong-tab, wrong-URL, unauthorized, stale or unrendered states, and any caption mismatch.
- Assertions, DOM counts and bounding boxes support a screenshot; they don't validate it. The image must independently match the caption's claim.
- Proof not visually checked = missing proof. Never argue around a broken screenshot.
- Captions and measurements match the current screenshot. Rerun changed counts/URLs/theme/state → update the caption or recapture.
