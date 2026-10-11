---
name: browser-and-maps
description: Pick the right browser, automation or map tool for Anshul's work. Use before any agent-driven browser work (opening or clicking through a website, filling forms, logging in, checking a rendered web UI, taking browser screenshots for proof, writing or running Playwright tests, getting past popups, dialogs, overlays or extension UI), and before any Google Maps work (real places, route planning, neighborhood or area views, "show me where X is on a map", My Maps, multi-pin maps, Street View, map screenshots).
---

# browser-and-maps

Which tool for which job. These rules are as binding as AGENTS.md.

## Browser work

| Job | Tool |
| --- | --- |
| Agent-driven browser work (default) | `agent-browser` |
| Visual checks only: looking at a rendered screen, proof screenshots | the native Chrome connector (Claude's in Claude, Codex's in Codex) |
| Test suites | Playwright |
| The connector is blocked by routine browser UI | Computer Use, in the same visible Chrome session |

Driving a workflow end to end:

- Handle ordinary popups, dialogs, overlays and extension UI yourself.
- If routine browser UI blocks the connector, switch to Computer Use in the same visible Chrome session. Keep the existing window and tabs.
- Pause only for a genuinely human-only checkpoint.

## Google Maps work

Real places, route planning, neighborhood views, "show me where X is on a map", custom My Maps, multi-pin views, Street View grabs, neighborhood or area visualizations, map screenshots:

- Use computer use (the `computer-use` MCP server) to drive real Google Maps in a real browser, and screenshot what's needed.
- Never roll your own Leaflet/OSM HTML page and never chase third-party static-map APIs. That is a rabbit hole.
