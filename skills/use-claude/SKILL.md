---
name: "use-claude"
description: "Use real Claude Code from Codex for delegated implementation or frontend work. Trigger when the user says use Claude, Claude agent, have Claude do it, all frontend work by Claude, or when frontend source/UI/CSS/browser UAT work must be implemented by Claude rather than Codex."
---

# Use Claude

Use this skill when work must be performed by real Claude Code from inside a Codex session, especially frontend implementation.

## Rules

- Do not substitute a Codex subagent when the user asks for Claude.
- For frontend source work, Codex orchestrates and verifies; Claude Code edits.
- If Claude is unavailable or cannot complete the task, report the blocker instead of implementing the frontend change in Codex.
- Keep Claude scoped: exact repo, branch, files it may edit, files it must not edit, acceptance criteria, commands to run, and whether git actions are forbidden.

## Launch

1. Confirm Claude exists:

```bash
command -v claude && claude --version
```

2. Use one of these patterns from the target repo:

```bash
claude -p --permission-mode auto --effort medium "<scoped prompt>"
```

```bash
claude --bg --name <short-task-name> --permission-mode auto --effort medium "<scoped prompt>"
```

3. Monitor background sessions:

```bash
claude agents --json
claude logs <id>
claude stop <id>
```

## Prompt Shape

Include:

- Repo/worktree path and current branch.
- User's exact selected direction or rejection.
- Allowed edit files and forbidden files.
- Required behavior and visual constraints.
- Required tests or checks.
- "Do not commit or push" unless the user explicitly wants Claude to do git actions.
- Concise final report: changed files, commands run, pass/fail, and unverified items.

## After Claude Returns

Codex must:

1. Review `git diff` for scope drift.
2. Run relevant tests/checks.
3. For UI work, inspect the real rendered screen with `agent-browser`.
4. Refresh required proof artifacts.
5. Only then commit, push, update PRs, or report completion.
