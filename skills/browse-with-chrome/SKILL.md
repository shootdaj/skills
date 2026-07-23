---
name: browse-with-chrome
description: Default browser workflow for researching the web and interacting with websites through the user's native Chrome connector and existing logged-in Chrome session. Use for any browsing activity, including web searches, opening URLs, reading dynamic pages, comparing products or prices, using logged-in sites, filling forms, downloading files, and multi-step website workflows, unless the user explicitly names another browser or asks for a non-browser app connector, API, or CLI.
---

# Browse with Chrome

Use the current harness's native Chrome connector as the default surface for
all website browsing. Preserve the user's existing tabs, profile, extensions,
and logged-in state.

Read [references/routing-and-adapters.md](references/routing-and-adapters.md)
before the first browser action in a task.

## Non-negotiable surface rule

The browser or connector explicitly named by the user always wins. Do not
replace it because another surface seems faster, cheaper, more capable, or
better suited.

If the named surface is unavailable, say it is unavailable and stop that
operation. Do not substitute another surface without the user's approval.

## Quick decision

Use these exact defaults:

```text
Website interaction or web research -> native Chrome connector
Direct app data operation           -> purpose-built app connector
Explicitly named alternative        -> named surface
Required connector unavailable      -> report blocker; do not substitute
```

Examples:

- "Search the web for the current Mac Studio price" means native Chrome, not a
  generic web-search tool.
- "Check my Gmail for a flight confirmation" means the Gmail connector, not
  Gmail's website, unless the user says to open Gmail in Chrome.
- "Use Comet to research Bali hotels" means Comet because the user explicitly
  overrode the default. If Comet is unavailable, report that blocker; do not use
  Chrome, generic web search, or a research agent instead.

## Routing contract

Apply these rules in order:

1. Follow an explicit surface request. If the user names Comet, an in-app
   browser, a web-search tool, an app connector, an API, or a CLI, use that
   surface for the requested operation.
2. When the task requires searching, opening, reading, inspecting, or
   interacting with websites and no other surface is specified, use the native
   Chrome connector.
3. Treat semantic operations on Gmail, Notion, Drive, Calendar, Linear, and
   similar services as app-connector work when a purpose-built connector is
   requested or clearly applicable. Opening or operating their website is
   Chrome work.
4. If the native Chrome connector is unavailable, disconnected, or lacks the
   required capability, report that blocker. Do not silently switch to another
   browser or automation system.

Do not interpret the phrase "search the web" as permission to select a generic
web-search tool. It is ordinary web research and therefore uses native Chrome.
If a required purpose-built app connector is unavailable, report that connector
blocker instead of silently converting the operation into website browsing.

Earlier use of another surface does not override this default for a new
browsing operation. Re-evaluate the user's latest instruction before each
operation.

## Prohibited fallbacks

Do not launch or substitute:

- standalone Playwright;
- Selenium or direct Chrome DevTools Protocol automation;
- `agent-browser`;
- OS-level Computer Use or cursor-driving tools;
- Comet;
- a generic headless browser;
- an in-app browser;
- a separate temporary browser profile.

Connector-internal browser APIs are allowed when they are part of the native
Chrome connector. Do not describe those internal APIs to the user as a
different browser choice.

## Browser workflow

### 1. Connect once

Load the harness's native Chrome instructions and establish one persistent
Chrome connection. Read the connector's complete documentation before its first
use in the task.

Reuse the same browser binding across turns. A missing or closed tab does not
invalidate the Chrome connection; acquire a fresh tab from the existing
connection.

Do not inspect cookies, local storage, browser profiles, passwords, session
databases, or authentication tokens.

### 2. Reuse the user's state

Prefer an already-open relevant tab. Otherwise open the requested or inferred
URL in the user's normal Chrome session.

Use the logged-in session as presented by the page. If sign-in or a permission
prompt blocks the task:

1. follow any supported connector recovery flow;
2. ask the user to sign in or click Allow in Chrome when manual action is
   required;
3. continue from the same Chrome session after the user confirms;
4. do not bypass authentication with another source or browser.

### 3. Browse and research

For web research:

- search and open sources in Chrome;
- inspect the actual page, not only search-result snippets;
- compare dates, prices, baggage rules, availability, and other live details
  at the source;
- prefer primary or official sources when exact or technical facts matter;
- keep direct URLs for the final answer;
- distinguish observed facts from inference.

For long research tasks, save useful findings incrementally to the requested
Notion page, document, or file. Do not wait until the end when partial results
would otherwise be lost.

### 4. Interact with websites

Use visible page state for clicking, typing, selecting, scrolling, uploading,
downloading, and form completion. Verify the result after every consequential
step.

Respect the user's latest limits, such as traveler count, baggage allowance,
budget, dates, neighborhoods, or account choice. Do not resurrect rejected
options.

Prepare forms and checkout pages when requested. Do not perform an irreversible
action such as purchase, send, delete, cancel, publish, or final submission
unless the user explicitly authorized that action and the harness's approval
rules permit it.

### 5. Keep the session usable

- Reuse tabs instead of opening duplicates.
- Close only tabs created for the current task when cleanup is useful.
- Never close or rearrange unrelated user tabs.
- Avoid changing the user's default browser, profile, extensions, or global
  Chrome settings.
- Do not expose private page contents beyond what the task requires.

## Verification

Before reporting completion:

1. Confirm the final URL and visible page state.
2. Confirm requested filters, dates, quantities, account, and form values.
3. Recheck totals and included fees at the latest available step.
4. Capture a screenshot when the user needs visual proof or when page state is
   central to the result.
5. State clearly when a value is estimated, stale, unavailable, or not carried
   through to final checkout.

Opening a page is not proof that the requested workflow succeeded.

## Failure handling

When Chrome setup or communication fails, use the native connector's own
troubleshooting instructions before retrying. Keep the same connector choice.

If recovery fails, tell the user exactly what is blocked and what manual action
is needed. Do not fall back to another browser-control mechanism unless the user
explicitly approves that new surface.

<codex_skill_adapter>
Use the bundled Chrome control skill and its native Chrome extension runtime.
Reuse the existing Chrome binding and tabs. Do not use a standalone browser MCP
or external Playwright process.
</codex_skill_adapter>

<claude_skill_adapter>
Use Claude in Chrome and the native Chrome connector exposed to Claude Code.
If it is not connected, ask the user to enable or reconnect it. Do not replace
it with direct Chrome automation.
</claude_skill_adapter>

<cursor_skill_adapter>
Use Cursor's native Chrome or browser connector only when it controls the
user's actual Chrome session. Inspect the connector documentation instead of
inventing tool names. If that connector is unavailable, report the blocker.
</cursor_skill_adapter>

<hermes_skill_adapter>
Use a Chrome-attached Hermes browser connector only when it controls the user's
actual Chrome session. The generic `web` toolset, a headless browser, and
Computer Use are not equivalent substitutes. If Chrome attachment is not
configured, report the blocker.
</hermes_skill_adapter>
