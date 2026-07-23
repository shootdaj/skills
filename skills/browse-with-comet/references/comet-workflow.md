# Comet Workflow

## Trigger test

Before any tool call, answer:

> Did the user's latest request explicitly name Comet, Perplexity browser, or
> comet-bridge?

- **Yes:** continue with Comet.
- **No:** do not use this skill or Comet.
- **Ambiguous historical mention:** follow the latest request and default
  browser-routing rules.

## Goal template

Build a compact Comet goal with these fields:

```text
Outcome:
Websites or search area:
Constraints:
Required extracted fields:
Save destination:
Forbidden final actions:
Completion condition:
```

Include only fields relevant to the request.

## Active loop

```text
comet_ask(goal)
repeat every 15-30 seconds:
    comet_screenshot()
    comet_poll()
    extract only new findings
    save new findings immediately
    if complete: verify and finish
    if no progress for 2-3 polls:
        capture final state
        save partial findings
        comet_stop()
        report partial completion
```

Use the actual MCP schemas exposed in the current harness. The pseudocode
describes ordering, not literal argument shapes.

## Progressive-save record

For each result, save enough information to resume without repeating work:

- stable title or identifier;
- direct URL;
- current price or key value;
- relevant constraints and inclusions;
- source and observation time;
- verification status;
- notes or blockers.

Deduplicate before appending.

## Recovery

### Permission or login prompt

Capture the state, ask the user for the one required manual action, then resume
the same Comet session.

### Navigation drift

Restate the bounded goal once. If the session continues on the wrong site or
task, save useful results and stop.

### No progress

After two or three unchanged polls, save visible partial data and call
`comet_stop`.

### Connector unavailable

Report:

> Comet was explicitly requested, but comet-bridge is not connected in this
> harness. I have not switched to another browser.

Do not suggest another surface unless the user asks for alternatives.

## Final report

State:

- what Comet completed;
- what was saved and where;
- direct links and verified values;
- any incomplete or stale fields;
- whether Comet was stopped because of a blocker;
- any manual next step still required.
