---
name: visual-proof-report
description: Turn verified test, CI, UAT, review, and runtime evidence into a mostly visual, plain-English HTML proof report. Use when the user asks to prove that work functions, explain what tests actually did, show why each test matters, create a visual test report, publish verification evidence, or replace a wall-of-text engineering report with scannable proof cards and explicit limitations.
---

# Visual Proof Report

Create a scan-first proof report that lets a non-technical reader understand what was tested, what passed, what would break if it failed, and what is still unproven.

## Required composition

Use these skills when available:

- `report-publisher` for the Standard Pyramid structure and permanent publishing.
- `anshul-ui-standards` for the report visual language and browser checks.
- `frontend-design` for the frontend build.
- `use-claude` when the current harness must delegate frontend work to real Claude Code.

Real Claude Code using the Fable model owns the HTML design and frontend implementation. The orchestrating agent gathers and checks evidence, reviews the result, tests it in the native browser, and publishes it.

Read [references/report-contract.md](references/report-contract.md) before structuring the report. Use [assets/visual-proof-template.html](assets/visual-proof-template.html) as the preferred starting shell when it fits; adapt the content and mini-visuals to the evidence rather than merely replacing words.

## Workflow

1. **Gather authoritative evidence.** Read the actual test output, requirement mapping, source tests, CI jobs, review result, commit, PR state, runtime evidence, and known limitations. Fresh evidence beats summaries. Never invent a pass, example, metric, or failure mode.

2. **Define the honest claim.** Write one verdict that says what the evidence proves and immediately qualifies its limits. Do not turn a controlled test into a universal reliability claim.

3. **Build the proof-card matrix.** Create one card per meaningful behavior or scenario. Every card must contain exactly these reader-facing fields:
   - **Tested** — the behavior or risk.
   - **Did** — what the test actually made the system do.
   - **Why** — why a user should care.
   - **If it failed** — the concrete harm or regression.
   - **Example** — a realistic, plain-English situation.

   Keep each field to one or two short sentences. Put test names, commands, hashes, query counts, and raw assertions in collapsed evidence.

4. **Design the scan path.** Lead with verdict, pass counts, failures, exact version, and merge/release state. Follow with one simple system flow, the proof-card grid, a prominent limitations panel, then collapsed technical evidence and exact source links.

5. **Build through Claude Fable.** Give Claude the verified evidence matrix, exact links, report contract, and template. Require a single self-contained `index.html`, plain English, real content, both themes, responsive layout, semantic tokens, accessible controls, and no report-about-the-report prose.

6. **Verify truth and usability.** Check every displayed number and claim against its source. In the native browser, inspect desktop and narrow widths in dark and light themes, open at least one proof detail, exercise navigation and theme controls, confirm no horizontal page overflow or console errors, and verify every link. Do not substitute standalone Playwright for the harness's native browser connector.

7. **Publish when requested.** Use `report-publisher` and `here-now` to publish permanently. Confirm HTTP 200 and that the live HTML matches the verified local file. If the user asked for local-only output, do not publish.

8. **Report briefly.** Give the live URL or local file, the fresh result summary, what remains unproven, and whether any merge or release gate remains.

## Evidence rules

- Separate **passed**, **failed**, **not run**, and **not applicable**. Never hide a failure inside an aggregate pass rate.
- Distinguish current local evidence, hosted CI, runtime/UAT, and reviewer conclusions.
- A test name is not proof by itself. Explain the action and observed result.
- Green CI is supporting evidence, not a substitute for the real user or system workflow.
- Show exact limitations near the verdict, not only in an appendix.
- If evidence is stale, partial, indirect, or missing, say so and weaken the claim.
- Keep merge, deployment, and approval state exact. A green open PR is not merged or shipped.

## Target adapters

<claude_skill_adapter>
Stay on Fable for the frontend build. Use Claude's native browser connector for report inspection.
</claude_skill_adapter>

<codex_skill_adapter>
Invoke real Claude Code explicitly with `--model fable` for the HTML build. Use Codex's native Chrome connector for report inspection.
</codex_skill_adapter>

<cursor_skill_adapter>
Use the configured real-Claude delegation route with Fable for the HTML build and Cursor's native Chrome-capable browser connector for inspection.
</cursor_skill_adapter>

<hermes_skill_adapter>
Use the configured real-Claude delegation route with Fable for the HTML build and a Chrome-attached Hermes browser connector for inspection.
</hermes_skill_adapter>
