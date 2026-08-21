# Routing and Harness Adapters

## Decision table

| User request | Default surface |
|---|---|
| "Search the web", "research this", or "look up current information" | Direct web search or fetch |
| Read a public page or documentation available without browser state | Direct web fetch |
| "Use Chrome", "open/show this in Chrome", or operate an existing tab | Native Chrome connector |
| Click, type, select, scroll, upload, download, or complete a site workflow | Native Chrome connector |
| Use Chrome login/extension state, inspect rendered layout, take a browser screenshot, or test a web UI | Native Chrome connector |
| "Use Comet" | Comet |
| "Use the in-app browser" | In-app browser |
| "Use web search" or names a specific search connector | Named search connector |
| "Check Gmail/Notion/Drive" with no request to open the website | Purpose-built app connector |
| "Open Gmail/Notion/Drive in Chrome" | Native Chrome connector |
| Local application interaction unrelated to a website | Appropriate non-browser tool |

Explicit instructions always win for the operation they govern. A named
alternative does not become the default for later browsing unless the user says
it should.

Never optimize away a named surface. If the user says "use Comet," select
Comet or report that Comet is unavailable. Do not replace it with Chrome, web
search, a research agent, or another connector.

"Search the web" does not select Chrome. "Check Gmail/Notion/Drive" selects
the applicable app connector. A URL is context unless the user asks to open it
or the task requires browser-only state.

## What requires browser control

Invoke this skill for:

- explicit requests to use, open, show, or navigate Chrome;
- taking over an existing Chrome tab;
- using the user's logged-in Chrome session or browser extensions;
- filling or submitting web forms;
- interacting with web dashboards and SPAs;
- clicking, typing, selecting, scrolling, uploading, or downloading through a
  website;
- inspecting rendered page state;
- capturing a screenshot of a live browser page;
- browser-based testing requested by the user.

Do not invoke this skill for:

- ordinary online research or source gathering;
- search-engine queries;
- reading public pages or documentation available by direct fetch;
- comparing public facts that search, an API, or a CLI can retrieve;
- semantic app operations served by purpose-built connectors;
- URLs supplied only as reference material.

Dynamic content alone is not enough. Chrome is required only when visible,
interactive, authenticated, extension-backed, or rendered page state matters to
the result.

## Shared safety rules

- Use the user's normal Chrome session and current authenticated state.
- Never inspect or export cookies, passwords, tokens, profile files, or local
  storage.
- Do not bypass a login wall by changing browsers or sources.
- Do not use a separate automation profile when the task depends on the user's
  logged-in account.
- Do not perform irreversible actions without explicit authorization.
- Do not switch browser surfaces after failure without user approval.

## Claude Code

Use Claude in Chrome or the native Chrome connector provided to Claude Code.
Load its instructions before interaction and retain the same connection.

If the connector is missing or disconnected, ask the user to enable or
reconnect Claude in Chrome. Do not use shell-launched browser automation as a
fallback.

## OpenAI Codex

Use the bundled Chrome control skill and the native Chrome plugin runtime. The
runtime may expose connector-internal automation methods; those are part of the
approved Chrome connector.

Do not launch standalone Playwright, use an external browser MCP, or route
through Computer Use. Reuse the existing browser and tab bindings when present.

## Cursor

Use Cursor's native browser or Chrome connection only if it controls the user's
real Chrome session. Read the tools exposed by the current Cursor build rather
than assuming names from another harness.

If only a generic or isolated browser is available, report that the required
Chrome connector is unavailable.

## Hermes

Use Hermes browser automation only when it is configured to attach to the
user's real Chrome session. Generic web search, headless browsing, and Computer
Use do not satisfy this skill's Chrome requirement.

If attachment is unavailable, stop and report the connector requirement. The
user may then explicitly choose another Hermes surface.

## Connector failure response

Use a short, actionable response:

> The native Chrome connector is not connected in this harness. Connect or
> enable it in Chrome, then tell me when it is ready. I have not switched to
> another browser.

Mention a more specific recovery action when the connector documentation
provides one.

## Verification checklist

- Correct browser surface used.
- Correct Chrome profile and logged-in state visible.
- Relevant existing tab reused when possible.
- Final URL and page state checked.
- User constraints preserved.
- Final price or submitted values rechecked at the last available step.
- Irreversible action performed only with explicit authorization.
- No unrelated tabs, settings, or browser data changed.
