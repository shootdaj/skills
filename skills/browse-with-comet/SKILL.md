---
name: browse-with-comet
description: Use Comet's agentic browser through comet-bridge only when the user's latest request explicitly says Comet, Perplexity browser, or comet-bridge. Handles authenticated dynamic websites, multi-step browse-and-extract workflows, polling, screenshots, progressive saving, and stall recovery. Do not invoke for generic requests to browse, research, find information, compare prices, check flights or hotels, shop, or open websites; those remain native Chrome tasks unless the user explicitly chooses Comet.
---

# Browse with Comet

Use Comet only as an explicit user-selected browser surface. Drive it through
the `comet-bridge` connector and preserve partial results during long agentic
browsing runs.

Read [references/comet-workflow.md](references/comet-workflow.md) before the
first Comet action in a task.

## Non-negotiable activation rule

Activate this skill only when the user's latest request explicitly names one of:

- Comet;
- Perplexity browser;
- `comet-bridge`;
- a clearly equivalent instruction such as "open this in Comet."

Do not infer Comet from:

- "browse the web";
- "research this";
- "find flights" or "check hotels";
- shopping or price comparison;
- an earlier request that used Comet;
- the fact that Comet may be good at dynamic websites.

Without an explicit current Comet request, use the user's normal browser-routing
rules. Do not advocate for or silently select Comet.

If Comet is unavailable, report that blocker and stop. Do not substitute native
Chrome, a generic web-search tool, a headless browser, Playwright, or Computer
Use unless the user approves a new surface.

## Connector contract

Use the `comet-bridge` MCP server and its Comet-native agentic browsing tools.
Prefer these operations when available:

- `comet_ask` to give Comet a goal;
- `comet_poll` to obtain progress and completion;
- `comet_screenshot` to inspect current visible state;
- `comet_stop` to end a stalled or redirected run.

Discover the exact callable tool schemas before use. Do not invent arguments.
Do not use OS-level Computer Use; it is a different surface.

## Workflow

### 1. Define the goal

Turn the request into a bounded outcome containing:

- target website or search goal;
- dates, people, budget, baggage, location, or other constraints;
- required fields to extract;
- the persistent destination for progressive results;
- any action Comet must not complete, such as purchase or final submission.

Reuse the user's existing constraints. Do not ask again for information already
present in the conversation or destination document.

### 2. Start Comet

Send one goal-oriented `comet_ask` request. Make the goal explicit enough for
Comet to navigate login walls, dynamic SPAs, result pages, and multi-step
browse-and-extract flows without repeatedly rediscovering scope.

When authentication or a permission prompt requires the user:

1. capture the current state;
2. ask the user to sign in or click Allow in Comet;
3. resume only after the user confirms;
4. do not change browser surfaces.

### 3. Drive an active poll loop

Do not wait passively for a long Comet run.

1. Poll every 15-30 seconds.
2. Capture a screenshot with each meaningful poll.
3. Extract new visible listings, prices, links, and status details.
4. Compare against previously saved findings.
5. Save new data immediately to the requested Notion page, file, or other
   persistent destination.
6. Continue until the task completes or reaches the user-defined limit.

If there is no meaningful progress for two or three polls:

1. capture one final screenshot;
2. extract and save whatever useful information is visible;
3. stop the Comet run;
4. report the stall and the partial results.

### 4. Preserve partial work

For long research, save after each useful listing or page. Do not batch all
findings until the end.

Mark unfinished sections as in progress. Deduplicate by stable identifiers such
as listing URL, flight number plus date, booking URL, or venue and event date.
Three verified partial results are better than losing the entire run.

### 5. Control consequential actions

Comet may navigate and fill forms when requested. Do not authorize an
irreversible action such as purchase, send, publish, cancel, delete, or final
submission unless the user explicitly requested that exact action and the
harness's approval rules permit it.

Stop at the final review step when authorization is absent or unclear.

## Verification

Before reporting completion:

1. Inspect a final screenshot or visible result state.
2. Confirm constraints and dates survived the workflow.
3. Confirm extracted links point to the intended pages rather than homepages.
4. Recheck prices, fees, baggage, taxes, or availability at the latest
   reachable step.
5. Confirm incremental results were persisted.
6. Label partial, estimated, stale, or unverified information clearly.

Do not claim success from a completed poll alone when the visible browser state
does not support it.

<codex_skill_adapter>
Discover and use the `comet-bridge` MCP tools. Do not route through the native
Chrome connector because the user explicitly selected Comet for this operation.
</codex_skill_adapter>

<claude_skill_adapter>
Use `comet-bridge` only when it is connected to Claude. If unavailable, report
the connector blocker instead of controlling Chrome directly.
</claude_skill_adapter>

<cursor_skill_adapter>
Use the configured `comet-bridge` MCP tools. Do not substitute Cursor's native
browser or terminal-launched automation.
</cursor_skill_adapter>

<hermes_skill_adapter>
Use `comet-bridge` only when it is configured as an available MCP server. Do
not substitute Hermes web search, generic browser automation, or Computer Use.
</hermes_skill_adapter>
