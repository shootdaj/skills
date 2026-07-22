---
name: "gopy"
description: "Create or prepare a concise goal objective from the current task and copy the exact goal text to the macOS clipboard. Use when the user says /gopy, gopy, copy goal, create goal and copy it, or asks to turn the current work into a goal copied to clipboard."
---

# Gopy

Turn the current task into one concise goal objective, optionally register it with the session goal tool, and copy the exact objective text to the clipboard.

## Workflow

1. Draft a single-sentence goal objective from the active user request and current context.
2. If `create_goal` is available, call it with that exact objective only when no active goal exists. If the call fails because a goal already exists, continue without blocking.
3. Copy the exact objective text to the macOS clipboard:

```bash
printf '%s' '<exact goal objective>' | pbcopy
```

4. Echo the exact copied goal text back to the user.

Keep the goal concrete and action-oriented. Do not include markdown, quotes, prefixes, status labels, or explanatory text in the clipboard contents.
