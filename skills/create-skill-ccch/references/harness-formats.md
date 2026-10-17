# Harness Formats

Use this reference to keep one skill compatible with Claude Code, Codex,
Cursor, and Hermes.

## Compatibility matrix

| Harness | Global location (skills CLI) | CLI agent id | Required package entry | Target notes |
|---|---|---|---|---|
| Claude Code | `~/.claude/skills/<name>` → `~/.agents/skills/<name>` (symlink) | `claude-code` | `SKILL.md` | Use the portable workflow and standard frontmatter. |
| OpenAI Codex | `~/.agents/skills/<name>` (read directly) | `codex` | `SKILL.md` | Add `agents/openai.yaml` for UI metadata. Keep no copy in `~/.codex/skills/`, or Codex sees it twice. |
| Cursor | `~/.agents/skills/<name>` (read directly) | `cursor` | `SKILL.md` | Add a Cursor adapter only when invocation or tool mapping differs. |
| Hermes | `~/.hermes/skills/<name>` → `~/.agents/skills/<name>` (symlink) | `hermes-agent` | `SKILL.md` | Minimal shared frontmatter is preferred; add Hermes metadata only in a verified dedicated variant. |

## Shared frontmatter

Use the smallest form accepted everywhere:

```yaml
---
name: skill-name
description: What the skill does and the concrete requests or contexts that should trigger it.
---
```

Keep target-specific metadata out of shared frontmatter. Codex UI metadata
belongs in `agents/openai.yaml`.

## Codex UI metadata

```yaml
interface:
  display_name: "Readable Skill Name"
  short_description: "Short description between 25 and 64 chars"
  default_prompt: "Use $skill-name to perform a representative task."
```

Quote all string values. The default prompt must explicitly contain the skill
name prefixed with `$`.

## Adapter decision

Use one portable `SKILL.md` by default.

Add a target adapter only when at least one of these is true:

- the harness exposes a different tool name for the same operation;
- invocation arguments require translation;
- interactive prompts require a harness-specific mechanism;
- the target cannot parse a required shared metadata field.

Keep adapter sections short. They translate the shared workflow; they do not
repeat it.

Suggested labels:

```xml
<claude_skill_adapter>
Target-specific translation only.
</claude_skill_adapter>

<codex_skill_adapter>
Target-specific translation only.
</codex_skill_adapter>

<cursor_skill_adapter>
Target-specific translation only.
</cursor_skill_adapter>

<hermes_skill_adapter>
Target-specific translation only.
</hermes_skill_adapter>
```

If a target would execute another target's adapter incorrectly, create a
dedicated variant instead of combining the adapters.

## Install with the skills CLI

Skills from `shootdaj/skills` are installed with Vercel's skills CLI
(`npx skills`, npm package `skills`), straight from GitHub. GitHub is the
registry: the CLI clones the repo's default branch, keeps one canonical copy
per skill in `~/.agents/skills/`, links it into each harness, and records the
source and hash in `~/.agents/.skill-lock.json`. Run every command on every
machine (the MacBook and the Mac Ultra) so they stay identical.

Always turn telemetry off. Without it, installs report the repo and skill names
to skills.sh, which lists them publicly.

```bash
export DISABLE_TELEMETRY=1 DO_NOT_TRACK=1

# new skill (after its pull request merges)
npx -y skills add shootdaj/skills -g -y -a claude-code codex cursor hermes-agent --skill <skill-name>

# a merged change to an installed skill
npx -y skills update -g -y <skill-name>

# what is installed, and from where
npx -y skills ls -g --json
```

Before installing, inspect each destination in the table above:

1. If it is missing, or already resolves to `~/.agents/skills/<skill-name>`,
   continue.
2. If it is a hand-made link into a checkout, or a copy of the same skill, move
   it to a backup folder (never delete it), then install.
3. If it is a different skill with the same name, stop and show the conflict.

Never install from a local path (`npx skills add ./skills/<name>`): local-path
installs are skipped by `update`, so they drift.

Verify on each machine: the destination resolves to
`~/.agents/skills/<skill-name>`; `test -r <destination>/SKILL.md`; the
installed `SKILL.md` matches `git show origin/master:skills/<skill-name>/SKILL.md`;
`npx -y skills ls -g --json` shows source `shootdaj/skills` (it lists only Claude
Code and Hermes Agent as agents; Codex and Cursor read `~/.agents/skills`
directly, so that is expected); and there are no dangling links.

## Validation checklist

- Folder and frontmatter names match.
- Name uses lowercase letters, digits, and hyphens and is under 64 characters.
- Description contains purpose and triggering contexts.
- `SKILL.md` has no unfinished markers or scaffold text.
- References are linked directly from `SKILL.md`.
- Bundled scripts execute successfully.
- `agents/openai.yaml` matches the skill.
- All installed destinations resolve to `~/.agents/skills/<skill-name>`, installed
  by the skills CLI from `shootdaj/skills` on every machine.
- The Git diff contains only intended files.
- The remote branch or pull request exists after publishing.
